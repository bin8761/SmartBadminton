import { Request, Response } from "express";
import { ZodError } from "zod";
import logger from "../../../shared/logger";
import { findUserByUsername } from "../../auth/repositories/user.repository";
import {
  createPaymentQrService,
  handlePaymentWebhookService,
  verifyPaymentService,
  ServiceError as PaymentServiceError,
} from "../services/payment.service";
import {
  createPaymentQrValidator,
  verifyPaymentValidator,
} from "../validators";
import { findLatestByBookingId } from "../repositories/payment.repository";

const toErrorDetails = (error: ZodError) =>
  error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

export const createPaymentQrHandler = async (req: Request, res: Response) => {
  try {
    logger.info(
      {
        bookingId: req.params?.bookingId ?? null,
        paymentTransactionId: null,
        provider: "SEPAY",
      },
      "payment.qr.create.requested",
    );

    if (!req.user?.username) {
      return res.fail({ code: "UNAUTHORIZED", message: "Chua dang nhap" }, 401);
    }

    const user = await findUserByUsername(req.user.username);
    if (!user) {
      return res.fail(
        { code: "USER_NOT_FOUND", message: "Nguoi dung khong ton tai" },
        404,
      );
    }

    const parsed = createPaymentQrValidator.parse({ params: req.params });
    const result = await createPaymentQrService({
      bookingId: parsed.params.bookingId,
      userId: user.id,
    });

    return res.success(result, 201);
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      return res.fail({ code: error.code, message: error.message }, error.status);
    }
    if (error instanceof ZodError) {
      return res.fail(
        {
          code: "VALIDATION_ERROR",
          message: "Du lieu khong hop le",
          details: toErrorDetails(error),
        },
        400,
      );
    }
    logger.error(
      {
        err: error,
        bookingId: req.params?.bookingId ?? null,
        paymentTransactionId: null,
      },
      "create payment qr failed",
    );
    return res.fail(
      { code: "INTERNAL_ERROR", message: "Khong the tao QR thanh toan" },
      500,
    );
  }
};

export const handleSepayWebhook = async (req: Request, res: Response) => {
  try {
    logger.info(
      {
        bookingId:
          (req.body as { bookingId?: string } | undefined)?.bookingId ?? null,
        paymentTransactionId: null,
        provider: "SEPAY",
      },
      "payment.webhook.received",
    );
    await handlePaymentWebhookService({
      headers: req.headers,
      body: req.body,
    });
    return res.status(200).end();
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      if (error.code === "INVALID_SIGNATURE") {
        return res.status(401).end();
      }
      return res.fail({ code: error.code, message: error.message }, error.status);
    }
    logger.error(
      {
        err: error,
        bookingId:
          (req.body as { bookingId?: string } | undefined)?.bookingId ?? null,
        paymentTransactionId: null,
      },
      "payment webhook failed",
    );
    return res.fail(
      { code: "INTERNAL_ERROR", message: "Khong the xu ly webhook" },
      500,
    );
  }
};

export const verifyPaymentHandler = async (req: Request, res: Response) => {
  try {
    logger.info(
      {
        bookingId: (req.body as { bookingId?: string } | undefined)?.bookingId ?? null,
        paymentTransactionId: null,
        provider: "SEPAY",
      },
      "payment.verify.requested",
    );
    if (!req.user?.username) {
      return res.fail({ code: "UNAUTHORIZED", message: "Chua dang nhap" }, 401);
    }

    const user = await findUserByUsername(req.user.username);
    if (!user) {
      return res.fail(
        { code: "USER_NOT_FOUND", message: "Nguoi dung khong ton tai" },
        404,
      );
    }

    const parsed = verifyPaymentValidator.parse({ body: req.body });
    const result = await verifyPaymentService({
      bookingId: parsed.body.bookingId,
      userId: user.id,
    });

    const latest = await findLatestByBookingId(parsed.body.bookingId);

    return res.success(
      {
        paymentTransactionId:
          (result.raw as { paymentTransactionId?: string } | undefined)
            ?.paymentTransactionId ?? latest?.id ?? null,
        paymentStatus: result.status,
        paidAt: result.paidAt ?? null,
        provider: latest?.provider ?? null,
        amount: latest?.amount ?? null,
        currency: latest?.currency ?? null,
      },
      200,
    );
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      return res.fail({ code: error.code, message: error.message }, error.status);
    }
    if (error instanceof ZodError) {
      return res.fail(
        {
          code: "VALIDATION_ERROR",
          message: "Du lieu khong hop le",
          details: toErrorDetails(error),
        },
        400,
      );
    }
    logger.error(
      {
        err: error,
        bookingId: (req.body as { bookingId?: string } | undefined)?.bookingId ?? null,
        paymentTransactionId: null,
      },
      "verify payment failed",
    );
    return res.fail(
      { code: "INTERNAL_ERROR", message: "Khong the xac minh thanh toan" },
      500,
    );
  }
};
