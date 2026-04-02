import { NextFunction, Request, Response } from "express";
import { ZodError, ZodType } from "zod";
import logger from "../../../shared/logger";
import type { ParamsDictionary } from "express-serve-static-core";

type PaymentRequestShape = {
  params?: ParamsDictionary;
  body?: unknown;
};

export const validatePaymentRequest =
  (schema: ZodType<PaymentRequestShape>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({ params: req.params, body: req.body });
      req.params = parsed.params ?? req.params;
      req.body = parsed.body ?? req.body;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        res.fail(
          {
            code: "VALIDATION_ERROR",
            message: "Du lieu khong hop le",
            details,
          },
          400,
        );
        return;
      }
      logger.error({ err: error }, "payment validation middleware failed");
      res.fail(
        { code: "INTERNAL_ERROR", message: "Khong the xu ly yeu cau" },
        500,
      );
    }
  };
