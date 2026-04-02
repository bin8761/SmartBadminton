import { BookingStatus, PaymentStatus } from '@prisma/client';
import prisma from '../../../src/shared/prisma';
import { handlePaymentWebhookService } from '../../../src/modules/payments/services/payment.service';
import { findLatestByBookingId } from '../../../src/modules/payments/repositories/payment.repository';

const mockValidateSignature = jest.fn();
const mockHandleWebhook = jest.fn();

jest.mock('../../../src/shared/prisma', () => ({
  __esModule: true,
  default: {
    booking: { findUnique: jest.fn() },
    paymentTransaction: { update: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../../src/modules/payments/providers/sepay.provider', () => ({
  SepayProvider: jest.fn().mockImplementation(() => ({
    validateSignature: (...args: unknown[]) => mockValidateSignature(...args),
    handleWebhook: (...args: unknown[]) => mockHandleWebhook(...args),
  })),
}));
jest.mock('../../../src/modules/payments/repositories/payment.repository');

const mockPrisma = prisma as unknown as {
  booking: { findUnique: jest.Mock };
  paymentTransaction: { update: jest.Mock };
  $transaction: jest.Mock;
};

const mockFindLatest = findLatestByBookingId as jest.Mock;

describe('handlePaymentWebhookService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('flags manual refund when late webhook paid and booking expired', async () => {
    mockValidateSignature.mockReturnValue(true);
    mockHandleWebhook.mockResolvedValue({
      status: 'PAID',
      paidAt: new Date('2026-03-22T10:00:00.000Z'),
      raw: { bookingId: 'booking-1' },
    });

    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'booking-1',
      userId: 'user-1',
      status: BookingStatus.EXPIRED,
      courtId: 'court-1',
      startTime: new Date('2026-03-22T12:00:00.000Z'),
      endTime: new Date('2026-03-22T13:00:00.000Z'),
      totalPrice: 200000,
    });

    mockFindLatest.mockResolvedValue({
      id: 'payment-1',
      status: PaymentStatus.EXPIRED,
      meta: { existing: true },
    });

    await handlePaymentWebhookService({ headers: {}, body: {} });

    expect(mockPrisma.paymentTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'payment-1' },
        data: expect.objectContaining({
          status: PaymentStatus.PAID,
          meta: expect.objectContaining({
            existing: true,
            refundRequired: true,
            refundReason: 'LATE_WEBHOOK_EXPIRED',
          }),
        }),
      }),
    );
  });
});
