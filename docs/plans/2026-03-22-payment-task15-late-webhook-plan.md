# Payment Task 15.1 Late Webhook Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Handle late SePay webhook payments by marking the payment PAID and flagging manual refund when booking is already EXPIRED.

**Architecture:** Add a late-payment branch in `handlePaymentWebhookService` that updates the latest payment transaction with a refund flag in `meta`, without changing booking status.

**Tech Stack:** Node.js, Express, TypeScript, Prisma, Jest

---

### Task 1: Add late-payment handling in payment service

**Files:**
- Modify: `backend/src/modules/payments/services/payment.service.ts`
- Test: `backend/tests/modules/payments/payment.service.test.ts`

**Step 1: Write the failing test**

```ts
import { BookingStatus, PaymentProvider, PaymentStatus } from '@prisma/client';
import prisma from '../../../src/shared/prisma';
import { handlePaymentWebhookService } from '../../../src/modules/payments/services/payment.service';
import { SepayProvider } from '../../../src/modules/payments/providers/sepay.provider';

jest.mock('../../../src/modules/payments/providers/sepay.provider');

const mockValidate = jest.fn();
const mockHandle = jest.fn();

(SepayProvider as jest.Mock).mockImplementation(() => ({
  validateSignature: mockValidate,
  handleWebhook: mockHandle,
}));

describe('handlePaymentWebhookService - late PAID', () => {
  beforeEach(async () => {
    mockValidate.mockReturnValue(true);
    mockHandle.mockResolvedValue({
      status: 'PAID',
      paidAt: new Date('2026-03-22T10:00:00.000Z'),
      raw: { bookingId: '00000000-0000-0000-0000-000000000001' },
    });

    await prisma.booking.create({
      data: {
        id: '00000000-0000-0000-0000-000000000001',
        userId: '00000000-0000-0000-0000-000000000010',
        courtId: '00000000-0000-0000-0000-000000000020',
        startTime: new Date('2026-03-22T12:00:00.000Z'),
        endTime: new Date('2026-03-22T13:00:00.000Z'),
        totalPrice: 200000,
        status: BookingStatus.EXPIRED,
      },
    });

    await prisma.paymentTransaction.create({
      data: {
        id: '00000000-0000-0000-0000-000000000099',
        bookingId: '00000000-0000-0000-0000-000000000001',
        provider: PaymentProvider.SEPAY,
        status: PaymentStatus.EXPIRED,
        amount: 200000,
        currency: 'VND',
        externalOrderId: 'ext-1',
        qrString: 'qr',
        meta: {},
      },
    });
  });

  it('marks payment PAID and flags manual refund when booking expired', async () => {
    await handlePaymentWebhookService({ headers: {}, body: {} });

    const payment = await prisma.paymentTransaction.findUnique({
      where: { id: '00000000-0000-0000-0000-000000000099' },
    });

    expect(payment?.status).toBe(PaymentStatus.PAID);
    expect((payment?.meta as { refundRequired?: boolean })?.refundRequired).toBe(true);
    expect((payment?.meta as { refundReason?: string })?.refundReason).toBe('LATE_WEBHOOK_EXPIRED');

    const booking = await prisma.booking.findUnique({
      where: { id: '00000000-0000-0000-0000-000000000001' },
    });
    expect(booking?.status).toBe(BookingStatus.EXPIRED);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/modules/payments/payment.service.test.ts -t "late PAID"`
Expected: FAIL (late-payment path not implemented).

**Step 3: Write minimal implementation**

```ts
  if (result.status === "PAID" && booking.status === BookingStatus.EXPIRED) {
    await prisma.paymentTransaction.update({
      where: { id: latest.id },
      data: {
        status: PaymentStatus.PAID,
        paidAt: result.paidAt ?? new Date(),
        meta: {
          ...(latest.meta ?? {}),
          refundRequired: true,
          refundReason: "LATE_WEBHOOK_EXPIRED",
        },
      },
    });

    logger.info(
      {
        bookingId: booking.id,
        paymentTransactionId: latest.id,
        refundReason: "LATE_WEBHOOK_EXPIRED",
      },
      "payment_late_webhook_refund_required",
    );

    return result;
  }
```

**Step 4: Run test to verify it passes**

Run: `npx jest tests/modules/payments/payment.service.test.ts -t "late PAID"`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/modules/payments/services/payment.service.ts \
  backend/tests/modules/payments/payment.service.test.ts
git commit -m "feat: handle late payment webhook with manual refund flag"
```
