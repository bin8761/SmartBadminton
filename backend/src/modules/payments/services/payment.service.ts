import { BookingStatus, PaymentProvider, PaymentStatus } from "@prisma/client";
import crypto from "crypto";
import config from "../../../config/env";
import logger from "../../../shared/logger";
import {
  paymentsFailureCounter,
  paymentsLatencyHistogram,
  paymentsSuccessCounter,
} from "../../../shared/metrics";
import prisma from "../../../shared/prisma";
import { enqueuePaymentTimeout } from "../../../shared/queue";
import {
  createPaymentTransaction,
  findByExternalOrderId,
  findLatestByBookingId,
  findPendingByBookingId,
  updateStatusById,
} from "../repositories/payment.repository";
import { SepayProvider } from "../providers/sepay.provider";
import type {
  PaymentWebhookContext,
  PaymentVerifyResult,
} from "../providers/provider.types";

export class ServiceError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export type CreatePaymentQrPayload = {
  bookingId: string;
  userId: string;
};

export type PaymentQrResult = {
  paymentTransactionId: string;
  qrString: string;
  expiresAt: Date;
};

const provider = new SepayProvider();

type BookingSnapshot = {
  courtId: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
};

type PaymentMeta = {
  bookingSnapshot: BookingSnapshot;
};

const toSnapshot = (booking: {
  courtId: string;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
}): BookingSnapshot => ({
  courtId: booking.courtId,
  startTime: booking.startTime.toISOString(),
  endTime: booking.endTime.toISOString(),
  totalPrice: booking.totalPrice,
});

const hasBookingChanged = (
  booking: BookingSnapshot,
  snapshot?: BookingSnapshot,
): boolean => {
  if (!snapshot) {
    return false;
  }
  return (
    booking.courtId !== snapshot.courtId ||
    booking.startTime !== snapshot.startTime ||
    booking.endTime !== snapshot.endTime ||
    booking.totalPrice !== snapshot.totalPrice
  );
};

const getBookingOrThrow = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      userId: true,
      status: true,
      courtId: true,
      startTime: true,
      endTime: true,
      totalPrice: true,
    },
  });

  if (!booking) {
    throw new ServiceError("BOOKING_NOT_FOUND", 404, "Khong tim thay don dat");
  }

  return booking;
};

export const createPaymentQrService = async (
  payload: CreatePaymentQrPayload,
): Promise<PaymentQrResult> => {
  const startedAt = Date.now();
  logger.info(
    {
      bookingId: payload.bookingId,
      paymentTransactionId: null,
      provider: PaymentProvider.SEPAY,
    },
    "payment.qr.create.requested",
  );

  const booking = await getBookingOrThrow(payload.bookingId);

  if (booking.userId !== payload.userId) {
    throw new ServiceError(
      "BOOKING_NOT_OWNED",
      403,
      "Don dat san khong thuoc nguoi dung hien tai",
    );
  }

  if (booking.status !== BookingStatus.PENDING_PAYMENT) {
    throw new ServiceError(
      "BOOKING_STATUS_NOT_PAYABLE",
      409,
      "Trang thai don dat san khong cho phep thanh toan",
    );
  }

  const bookingSnapshot = toSnapshot(booking);
  const pending = await findPendingByBookingId(booking.id);

  if (pending) {
    const meta = pending.meta as PaymentMeta | null | undefined;
    const previousSnapshot = meta?.bookingSnapshot;
    const changed = hasBookingChanged(bookingSnapshot, previousSnapshot);

    if (!changed) {
      if (!pending.qrString) {
        throw new ServiceError(
          "PAYMENT_QR_MISSING",
          500,
          "Khong tim thay QR hien tai",
        );
      }
      return {
        paymentTransactionId: pending.id,
        qrString: pending.qrString,
        expiresAt: new Date(
          pending.createdAt.getTime() +
            config.payment.timeoutMinutes * 60 * 1000,
        ),
      };
    }

    await updateStatusById(pending.id, PaymentStatus.FAILED, null);
  }

  try {
    const qr = await provider.createQr({
      bookingId: booking.id,
      amount: booking.totalPrice,
      currency: "VND",
      description: `SB_${booking.id}`,
    });

    const payment = await createPaymentTransaction({
      bookingId: booking.id,
      provider: PaymentProvider.SEPAY,
      status: PaymentStatus.PENDING,
      amount: booking.totalPrice,
      currency: "VND",
      externalOrderId: crypto.randomUUID(),
      externalRequestId: qr.externalRequestId ?? null,
      qrString: qr.qrString,
      meta: {
        bookingSnapshot,
        providerPayload: qr.raw,
      },
    });

    logger.info(
      {
        bookingId: booking.id,
        paymentTransactionId: payment.id,
        provider: payment.provider,
        amount: payment.amount,
        currency: payment.currency,
      },
      "payment.qr.create.succeeded",
    );
    paymentsSuccessCounter
      .labels(payment.provider, "success")
      .inc();
    paymentsLatencyHistogram
      .labels(payment.provider, "qr_create")
      .observe(Date.now() - startedAt);

  logger.info(
    {
      bookingId: booking.id,
      paymentTransactionId: payment.id,
      amount: booking.totalPrice,
    },
    "payment_qr_created",
  );

  const delayMs = config.payment.timeoutMinutes * 60 * 1000;
  try {
    await enqueuePaymentTimeout(booking.id, delayMs);
    logger.info(
      {
        bookingId: booking.id,
        paymentTransactionId: payment.id,
        provider: payment.provider,
        delayMs,
      },
      "payment_timeout_enqueued",
    );
  } catch (error) {
    logger.warn(
      {
        err: error,
        bookingId: booking.id,
        paymentTransactionId: payment.id,
        provider: payment.provider,
      },
      "enqueue payment timeout failed",
    );
  }

  return {
    paymentTransactionId: payment.id,
    qrString: qr.qrString,
    expiresAt: new Date(
      payment.createdAt.getTime() +
        config.payment.timeoutMinutes * 60 * 1000,
    ),
  };
  } catch (error) {
    logger.error(
      {
        err: error,
        bookingId: booking.id,
        paymentTransactionId: null,
        provider: PaymentProvider.SEPAY,
      },
      "payment.qr.create.failed",
    );
    paymentsFailureCounter
      .labels(PaymentProvider.SEPAY, "failure")
      .inc();
    paymentsLatencyHistogram
      .labels(PaymentProvider.SEPAY, "qr_create")
      .observe(Date.now() - startedAt);
    throw error;
  }
};

const resolveBookingIdFromWebhook = (result: PaymentVerifyResult) => {
  const raw = result.raw as { bookingId?: string } | undefined;
  return raw?.bookingId;
};

export const handlePaymentWebhookService = async (
  context: PaymentWebhookContext,
): Promise<PaymentVerifyResult> => {
  const startedAt = Date.now();
  logger.info(
    {
      bookingId: null,
      paymentTransactionId: null,
      provider: PaymentProvider.SEPAY,
    },
    "payment.webhook.received",
  );

  if (!provider.validateSignature(context)) {
    throw new ServiceError("INVALID_SIGNATURE", 401, "Invalid signature");
  }

  const result = await provider.handleWebhook(context);
  const bookingId = resolveBookingIdFromWebhook(result);

  if (!bookingId) {
    throw new ServiceError("BOOKING_NOT_FOUND", 404, "Khong tim thay don dat");
  }

  const booking = await getBookingOrThrow(bookingId);
  const latest = await findLatestByBookingId(bookingId);

  if (!latest) {
    throw new ServiceError(
      "PAYMENT_NOT_FOUND",
      404,
      "Khong tim thay thanh toan",
    );
  }

  if (latest.status === PaymentStatus.PAID) {
    logger.info(
      {
        bookingId: booking.id,
        paymentTransactionId: latest.id,
        provider: latest.provider,
        paymentStatus: latest.status,
      },
      "payment.webhook.processed",
    );
    paymentsSuccessCounter
      .labels(latest.provider, "success")
      .inc();
    paymentsLatencyHistogram
      .labels(latest.provider, "webhook")
      .observe(Date.now() - startedAt);
    return {
      ...result,
      status: "PAID",
    };
  }

  if (result.status === "PAID" && booking.status === BookingStatus.EXPIRED) {
    const currentMeta =
      (latest.meta ?? {}) as Record<string, unknown>;

    await prisma.paymentTransaction.update({
      where: { id: latest.id },
      data: {
        status: PaymentStatus.PAID,
        paidAt: result.paidAt ?? new Date(),
        meta: {
          ...currentMeta,
          refundRequired: true,
          refundReason: "LATE_WEBHOOK_EXPIRED",
        },
      },
    });

    logger.info(
      {
        bookingId: booking.id,
        paymentTransactionId: latest.id,
        provider: latest.provider,
        refundReason: "LATE_WEBHOOK_EXPIRED",
      },
      "payment_late_webhook_refund_required",
    );
    logger.info(
      {
        bookingId: booking.id,
        paymentTransactionId: latest.id,
        provider: latest.provider,
        paymentStatus: "PAID",
        reason: "LATE_WEBHOOK_EXPIRED",
      },
      "payment.webhook.processed",
    );
    paymentsSuccessCounter
      .labels(latest.provider, "success")
      .inc();
    paymentsLatencyHistogram
      .labels(latest.provider, "webhook")
      .observe(Date.now() - startedAt);

    return result;
  }

  if (result.status === "PAID" && booking.status === BookingStatus.PENDING_PAYMENT) {
    await prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { id: latest.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: result.paidAt ?? new Date(),
        },
      });
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.PAID },
      });
    });

    logger.info(
      {
        bookingId: booking.id,
        paymentTransactionId: latest.id,
        provider: latest.provider,
        paymentStatus: "PAID",
      },
      "payment.webhook.processed",
    );
    paymentsSuccessCounter
      .labels(latest.provider, "success")
      .inc();
    paymentsLatencyHistogram
      .labels(latest.provider, "webhook")
      .observe(Date.now() - startedAt);
    return result;
  }

  if (result.status === "FAILED") {
    await updateStatusById(latest.id, PaymentStatus.FAILED, null);
    logger.info(
      {
        bookingId: booking.id,
        paymentTransactionId: latest.id,
        provider: latest.provider,
        paymentStatus: "FAILED",
      },
      "payment.webhook.processed",
    );
    paymentsFailureCounter
      .labels(latest.provider, "failure")
      .inc();
    paymentsLatencyHistogram
      .labels(latest.provider, "webhook")
      .observe(Date.now() - startedAt);
  }

  paymentsFailureCounter
    .labels(latest.provider, "failure")
    .inc();
  paymentsLatencyHistogram
    .labels(latest.provider, "webhook")
    .observe(Date.now() - startedAt);
  return result;
};

export const verifyPaymentService = async (
  payload: { bookingId: string; userId: string },
): Promise<PaymentVerifyResult> => {
  const startedAt = Date.now();
  logger.info(
    {
      bookingId: payload.bookingId,
      paymentTransactionId: null,
      provider: PaymentProvider.SEPAY,
    },
    "payment.verify.requested",
  );

  const booking = await getBookingOrThrow(payload.bookingId);

  if (booking.userId !== payload.userId) {
    throw new ServiceError(
      "BOOKING_NOT_OWNED",
      403,
      "Don dat san khong thuoc nguoi dung hien tai",
    );
  }

  const latest = await findLatestByBookingId(payload.bookingId);
  if (!latest) {
    throw new ServiceError(
      "PAYMENT_NOT_FOUND",
      404,
      "Khong tim thay thanh toan",
    );
  }

  if (latest.status === PaymentStatus.PAID) {
    logger.info(
      {
        bookingId: booking.id,
        paymentTransactionId: latest.id,
        provider: latest.provider,
        paymentStatus: "PAID",
        paidAt: latest.paidAt ?? undefined,
      },
      "payment.verify.succeeded",
    );
    paymentsSuccessCounter
      .labels(latest.provider, "success")
      .inc();
    paymentsLatencyHistogram
      .labels(latest.provider, "verify")
      .observe(Date.now() - startedAt);
    return {
      status: "PAID",
      paidAt: latest.paidAt ?? undefined,
      raw: { paymentTransactionId: latest.id },
    };
  }

  const result = await provider.verify({
    externalOrderId: payload.bookingId,
  });

  if (result.status === "PAID" && booking.status === BookingStatus.PENDING_PAYMENT) {
    await prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { id: latest.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: result.paidAt ?? new Date(),
        },
      });
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.PAID },
      });
    });
    logger.info(
      {
        bookingId: booking.id,
        paymentTransactionId: latest.id,
        provider: latest.provider,
        paymentStatus: "PAID",
        paidAt: result.paidAt ?? undefined,
      },
      "payment.verify.succeeded",
    );
    paymentsSuccessCounter
      .labels(latest.provider, "success")
      .inc();
    paymentsLatencyHistogram
      .labels(latest.provider, "verify")
      .observe(Date.now() - startedAt);
    return result;
  }

  if (result.status === "FAILED") {
    await updateStatusById(latest.id, PaymentStatus.FAILED, null);
    logger.info(
      {
        bookingId: booking.id,
        paymentTransactionId: latest.id,
        provider: latest.provider,
        paymentStatus: "FAILED",
      },
      "payment.verify.failed",
    );
    paymentsFailureCounter
      .labels(latest.provider, "failure")
      .inc();
    paymentsLatencyHistogram
      .labels(latest.provider, "verify")
      .observe(Date.now() - startedAt);
    return result;
  }

  logger.info(
    {
      bookingId: booking.id,
      paymentTransactionId: latest.id,
      provider: latest.provider,
      paymentStatus: result.status,
    },
    "payment.verify.failed",
  );
  paymentsFailureCounter
    .labels(latest.provider, "failure")
    .inc();
  paymentsLatencyHistogram
    .labels(latest.provider, "verify")
    .observe(Date.now() - startedAt);
  return result;
};
