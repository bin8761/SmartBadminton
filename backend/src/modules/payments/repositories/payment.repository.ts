import { PrismaClient, PaymentProvider, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

type CreatePaymentTransactionInput = {
  bookingId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  currency: string;
  externalOrderId: string;
  externalRequestId?: string | null;
  payUrl?: string | null;
  qrString?: string | null;
  meta?: object | null;
};

export const createPaymentTransaction = (data: CreatePaymentTransactionInput) =>
  prisma.paymentTransaction.create({
    data: {
      ...data,
      externalRequestId: data.externalRequestId ?? null,
      payUrl: data.payUrl ?? null,
      qrString: data.qrString ?? null,
      meta: data.meta ?? undefined,
    },
  });

export const findLatestByBookingId = (bookingId: string) =>
  prisma.paymentTransaction.findFirst({
    where: { bookingId },
    orderBy: { createdAt: 'desc' },
  });

export const findPendingByBookingId = (bookingId: string) =>
  prisma.paymentTransaction.findFirst({
    where: { bookingId, status: PaymentStatus.PENDING },
    orderBy: { createdAt: 'desc' },
  });

export const updateStatusById = (
  id: string,
  status: PaymentStatus,
  paidAt?: Date | null,
) =>
  prisma.paymentTransaction.update({
    where: { id },
    data: {
      status,
      paidAt: paidAt ?? undefined,
    },
  });

export const findByExternalOrderId = (
  provider: PaymentProvider,
  externalOrderId: string,
) =>
  prisma.paymentTransaction.findUnique({
    where: { provider_externalOrderId: { provider, externalOrderId } },
  });
