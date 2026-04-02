import { BookingStatus, Prisma } from "@prisma/client";
import prisma from "../../../shared/prisma";

type PrismaClientLike = Prisma.TransactionClient | typeof prisma;

type CancelBookingContext = {
  id: string;
  userId: string;
  status: BookingStatus;
  startTime: Date;
  totalPrice: number;
  refundTransactions: { id: string }[];
};

export type CancelBookingVerification = {
  booking: CancelBookingContext | null;
  isOwner: boolean;
  isCancellableStatus: boolean;
};

export type CancelBookingUpdateInput = {
  bookingId: string;
  canceledBy: string;
  canceledAt: Date;
  cancelReason: string;
  refundPolicy: string;
  refundAmount: number;
  refundStatus: string;
};

export type CreateRefundTransactionInput = {
  bookingId: string;
  amount: number;
  currency?: string;
  policy: string;
  status: string;
  source: string;
  note?: string | null;
};

export const checkOverlap = async (
  courtId: string,
  startTime: Date,
  endTime: Date,
  client: PrismaClientLike = prisma,
): Promise<boolean> => {
  const overlap = await client.booking.findFirst({
    where: {
      courtId,
      status: { in: ["PENDING_PAYMENT", "PAID"] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { id: true },
  });

  return Boolean(overlap);
};

export const createBooking = (
  data: Prisma.BookingUncheckedCreateInput,
  client: PrismaClientLike = prisma,
) => client.booking.create({ data });

export const findBookingByIdForCancel = (
  bookingId: string,
  client: PrismaClientLike = prisma,
) =>
  client.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      userId: true,
      status: true,
      startTime: true,
      totalPrice: true,
      refundTransactions: {
        select: { id: true },
      },
    },
  });

export const verifyCancelBookingContext = async (
  bookingId: string,
  userId: string,
  client: PrismaClientLike = prisma,
): Promise<CancelBookingVerification> => {
  const booking = await findBookingByIdForCancel(bookingId, client);

  if (!booking) {
    return {
      booking: null,
      isOwner: false,
      isCancellableStatus: false,
    };
  }

  return {
    booking,
    isOwner: booking.userId === userId,
    isCancellableStatus: booking.status === BookingStatus.PAID,
  };
};

export const updateBookingAsCanceled = (
  input: CancelBookingUpdateInput,
  client: PrismaClientLike = prisma,
) =>
  client.booking.update({
    where: { id: input.bookingId },
    data: {
      status: BookingStatus.CANCELED,
      canceledBy: input.canceledBy,
      canceledAt: input.canceledAt,
      cancelReason: input.cancelReason,
      refundPolicy: input.refundPolicy,
      refundAmount: input.refundAmount,
      refundStatus: input.refundStatus,
    },
  });

export const createRefundTransaction = (
  input: CreateRefundTransactionInput,
  client: PrismaClientLike = prisma,
) =>
  client.refundTransaction.create({
    data: {
      bookingId: input.bookingId,
      amount: input.amount,
      currency: input.currency ?? "VND",
      policy: input.policy,
      status: input.status,
      source: input.source,
      note: input.note ?? null,
    },
  });

export const executeCancelBookingUpdateTransaction = (
  input: CancelBookingUpdateInput,
) =>
  prisma.$transaction(async (tx) => updateBookingAsCanceled(input, tx));

export const executeCancelBookingWithRefundTransaction = (
  bookingUpdate: CancelBookingUpdateInput,
  refundInput: Omit<CreateRefundTransactionInput, "bookingId">,
) =>
  prisma.$transaction(async (tx) => {
    const booking = await updateBookingAsCanceled(bookingUpdate, tx);
    const refundTransaction = await createRefundTransaction(
      {
        bookingId: booking.id,
        amount: refundInput.amount,
        currency: refundInput.currency,
        policy: refundInput.policy,
        status: refundInput.status,
        source: refundInput.source,
        note: refundInput.note,
      },
      tx,
    );

    return { booking, refundTransaction };
  });
