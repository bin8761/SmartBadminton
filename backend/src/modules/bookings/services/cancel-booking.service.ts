import { BookingStatus, Role } from "@prisma/client";
import config from "../../../config/env";
import logger from "../../../shared/logger";
import { createInAppNotification } from "../../../shared/notifications";
import {
  bookingsCanceledCounter,
  bookingsCancelDurationHistogram,
  refundManualPendingCounter,
} from "../../../shared/metrics";
import {
  executeCancelBookingWithRefundTransaction,
  verifyCancelBookingContext,
} from "../repositories/booking.repository";
import { calculateRefundPolicy } from "./refund-calculator";
import { REFUND_POLICY, REFUND_STATUS } from "../types/refund";

export class ServiceError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export type CancelBookingPayload = {
  bookingId: string;
  userId: string;
  userRole: Role;
  reason: string;
  canceledAt?: Date;
};

export type CancelBookingEligibility = {
  bookingId: string;
  userId: string;
  status: BookingStatus;
  startTime: Date;
  totalPrice: number;
};

export type CancelBookingResult = {
  bookingId: string;
  status: BookingStatus;
  canceledAt: Date;
  refundPolicy: string;
  refundAmount: number;
  refundStatus: string;
  refundTransactionId: string;
};

const throwConflictForNonCancellableBooking = (
  status: BookingStatus,
  hasRefundTransaction: boolean,
): never => {
  if (hasRefundTransaction || status === BookingStatus.CANCELED) {
    throw new ServiceError(
      "BOOKING_ALREADY_CANCELED",
      409,
      "Don dat san da duoc huy",
    );
  }

  throw new ServiceError(
    "BOOKING_STATUS_NOT_CANCELLABLE",
    409,
    "Trang thai don dat san khong cho phep huy",
  );
};

export const cancelBookingService = async (
  payload: CancelBookingPayload,
): Promise<CancelBookingResult> => {
  const start = Date.now();
  let refundPolicyLabel = "UNKNOWN";

  logger.info(
    {
      bookingId: payload.bookingId,
      userId: payload.userId,
      userRole: payload.userRole,
      hasReason: Boolean(payload.reason?.trim()),
    },
    "booking_cancel_requested",
  );
  logger.info(
    {
      event: "BOOKING_CANCEL_ATTEMPT",
      bookingId: payload.bookingId,
      userId: payload.userId,
      userRole: payload.userRole,
    },
    "booking_audit_event",
  );

  try {
    if (payload.userRole !== Role.CUSTOMER) {
      logger.warn(
        {
          bookingId: payload.bookingId,
          userId: payload.userId,
          userRole: payload.userRole,
          reasonCode: "BOOKING_NOT_OWNED",
        },
        "booking_cancel_rejected",
      );
      throw new ServiceError(
        "BOOKING_NOT_OWNED",
        403,
        "Don dat san khong thuoc nguoi dung hien tai",
      );
    }

    const verification = await verifyCancelBookingContext(
      payload.bookingId,
      payload.userId,
    );

    if (!verification.booking) {
      logger.warn(
        {
          bookingId: payload.bookingId,
          userId: payload.userId,
          reasonCode: "BOOKING_NOT_FOUND",
        },
        "booking_cancel_rejected",
      );
      throw new ServiceError(
        "BOOKING_NOT_FOUND",
        404,
        "Khong tim thay don dat san",
      );
    }

    if (!verification.isOwner) {
      logger.warn(
        {
          bookingId: payload.bookingId,
          userId: payload.userId,
          bookingOwnerId: verification.booking.userId,
          reasonCode: "BOOKING_NOT_OWNED",
        },
        "booking_cancel_rejected",
      );
      throw new ServiceError(
        "BOOKING_NOT_OWNED",
        403,
        "Don dat san khong thuoc nguoi dung hien tai",
      );
    }

    if (
      verification.booking.refundTransactions.length > 0 ||
      !verification.isCancellableStatus
    ) {
      const reasonCode =
        verification.booking.refundTransactions.length > 0 ||
        verification.booking.status === BookingStatus.CANCELED
          ? "BOOKING_ALREADY_CANCELED"
          : "BOOKING_STATUS_NOT_CANCELLABLE";
      logger.warn(
        {
          bookingId: payload.bookingId,
          userId: payload.userId,
          bookingStatus: verification.booking.status,
          hasRefundTransaction:
            verification.booking.refundTransactions.length > 0,
          reasonCode,
        },
        "booking_cancel_rejected",
      );
      throwConflictForNonCancellableBooking(
        verification.booking.status,
        verification.booking.refundTransactions.length > 0,
      );
    }

    const eligibleBooking: CancelBookingEligibility = {
      bookingId: verification.booking.id,
      userId: verification.booking.userId,
      status: verification.booking.status,
      startTime: verification.booking.startTime,
      totalPrice: verification.booking.totalPrice,
    };

    const canceledAt = payload.canceledAt ?? new Date();
    const refundPolicy = calculateRefundPolicy({
      startTime: eligibleBooking.startTime,
      canceledAt,
    });
    refundPolicyLabel = refundPolicy;

    const refundAmount =
      refundPolicy === REFUND_POLICY.REFUND_70
        ? Math.round(
            eligibleBooking.totalPrice * config.booking.cancel.refundRate,
          )
        : 0;
    const refundStatus =
      refundPolicy === REFUND_POLICY.NO_REFUND
        ? REFUND_STATUS.COMPLETED_MANUAL
        : REFUND_STATUS.PENDING_MANUAL;

    const { booking, refundTransaction } =
      await executeCancelBookingWithRefundTransaction(
        {
          bookingId: eligibleBooking.bookingId,
          canceledBy: payload.userId,
          canceledAt,
          cancelReason: payload.reason,
          refundPolicy,
          refundAmount,
          refundStatus,
        },
        {
          amount: refundAmount,
          policy: refundPolicy,
          status: refundStatus,
          source: "BOOKING_CANCEL",
          note:
            refundPolicy === REFUND_POLICY.NO_REFUND
              ? "Cancellation occurred within non-refundable window"
              : null,
        },
      );

    const result: CancelBookingResult = {
      bookingId: booking.id,
      status: booking.status,
      canceledAt: booking.canceledAt ?? canceledAt,
      refundPolicy,
      refundAmount,
      refundStatus,
      refundTransactionId: refundTransaction.id,
    };

    if (refundStatus === REFUND_STATUS.PENDING_MANUAL) {
      refundManualPendingCounter.inc();
    }

    bookingsCanceledCounter.inc({
      result: "success",
      refund_policy: refundPolicyLabel,
    });

    logger.info(
      {
        event: "BOOKING_CANCELED",
        bookingId: result.bookingId,
        userId: payload.userId,
        status: result.status,
        refundPolicy: result.refundPolicy,
        refundAmount: result.refundAmount,
        refundStatus: result.refundStatus,
        refundTransactionId: result.refundTransactionId,
      },
      "booking_canceled",
    );

    try {
      await createInAppNotification({
        userId: payload.userId,
        type: "BOOKING_CANCELED",
        title: "Huy dat san thanh cong",
        message:
          refundStatus === REFUND_STATUS.COMPLETED_MANUAL
            ? "Don dat san da duoc huy. Don nay khong thuoc dien hoan tien."
            : "Don dat san da duoc huy. Yeu cau hoan tien da duoc ghi nhan.",
        metadata: {
          bookingId: result.bookingId,
          refundPolicy: result.refundPolicy,
          refundAmount: result.refundAmount,
          refundStatus: result.refundStatus,
          refundTransactionId: result.refundTransactionId,
        },
      });
    } catch (notificationError) {
      logger.warn(
        {
          bookingId: result.bookingId,
          userId: payload.userId,
          err: notificationError,
        },
        "booking_cancel_notification_failed",
      );
    }

    return result;
  } catch (error) {
    logger.warn(
      {
        bookingId: payload.bookingId,
        userId: payload.userId,
        errorCode: error instanceof ServiceError ? error.code : "INTERNAL_ERROR",
      },
      "booking_cancel_rejected",
    );
    bookingsCanceledCounter.inc({
      result: "failed",
      refund_policy: refundPolicyLabel,
    });
    throw error;
  } finally {
    bookingsCancelDurationHistogram.observe(Date.now() - start);
  }
};
