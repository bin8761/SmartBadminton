import { Request, Response } from "express";
import { ZodError } from "zod";
import logger from "../../../shared/logger";
import { findUserByUsername } from "../../auth/repositories/user.repository";
import {
  createBookingService,
  ServiceError as CreateBookingServiceError,
} from "../services/create-booking.service";
import {
  cancelBookingService,
  ServiceError as CancelBookingServiceError,
} from "../services/cancel-booking.service";
import { validateCancelBookingPayload } from "../validators/cancel-booking.validator";
import { validateCreateBookingPayload } from "../validators/create-booking.validator";

export const createBookingHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user?.username) {
      return res.fail({ code: "UNAUTHORIZED", message: "Chua dang nhap" }, 401);
    }

    const user = await findUserByUsername(req.user.username);
    if (!user) {
      return res.fail(
        { code: "INTERNAL_ERROR", message: "Khong the xu ly yeu cau" },
        500,
      );
    }

    const parsed = validateCreateBookingPayload(req.body);
    const result = await createBookingService({
      userId: user.id,
      courtId: parsed.courtId,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
    });

    return res.success(result, 201);
  } catch (error) {
    if (error instanceof CreateBookingServiceError) {
      return res.fail(
        { code: error.code, message: error.message },
        error.status,
      );
    }
    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return res.fail(
        {
          code: "VALIDATION_ERROR",
          message: "Du lieu khong hop le",
          details,
        },
        400,
      );
    }
    logger.error({ err: error }, "create booking failed");
    return res.fail(
      { code: "INTERNAL_ERROR", message: "Khong the tao booking" },
      500,
    );
  }
};

export const cancelBookingHandler = async (req: Request, res: Response) => {
  try {
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

    const parsed = validateCancelBookingPayload({
      params: req.params,
      body: req.body,
    });

    const result = await cancelBookingService({
      bookingId: parsed.params.bookingId,
      userId: user.id,
      userRole: user.role,
      reason: parsed.body.reason,
    });

    return res.success(result, 200);
  } catch (error) {
    if (error instanceof CancelBookingServiceError) {
      return res.fail(
        { code: error.code, message: error.message },
        error.status,
      );
    }
    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return res.fail(
        {
          code: "INVALID_CANCEL_REASON",
          message: "Du lieu khong hop le",
          details,
        },
        400,
      );
    }
    logger.error({ err: error }, "cancel booking failed");
    return res.fail(
      { code: "INTERNAL_ERROR", message: "Khong the huy booking" },
      500,
    );
  }
};
