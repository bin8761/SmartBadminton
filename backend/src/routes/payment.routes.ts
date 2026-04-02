import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import {
  createPaymentQrHandler,
  handleSepayWebhook,
  verifyPaymentHandler,
} from "../modules/payments/controllers";
import {
  validatePaymentRequest,
  validateSepayWebhookSignature,
} from "../modules/payments/middleware";
import {
  createPaymentQrValidator,
  verifyPaymentValidator,
} from "../modules/payments/validators";

const router = Router();

router.post(
  "/:bookingId/qr",
  authenticate,
  requireRole("CUSTOMER"),
  validatePaymentRequest(createPaymentQrValidator),
  createPaymentQrHandler,
);

router.post(
  "/verify",
  authenticate,
  requireRole("CUSTOMER"),
  validatePaymentRequest(verifyPaymentValidator),
  verifyPaymentHandler,
);

router.post(
  "/webhooks/sepay",
  validateSepayWebhookSignature,
  handleSepayWebhook,
);

export default router;
