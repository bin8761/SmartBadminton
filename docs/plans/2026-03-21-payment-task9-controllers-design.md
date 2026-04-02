# Payment Task 9 Controllers Design

**Date:** 2026-03-21

## Goal
Implement payment controllers for QR creation, SePay webhook handling, and client verify according to the SePay QR dynamic flow, keeping controllers thin and aligned with existing response/error conventions.

## Scope
- Create controllers in `backend/src/modules/payments/controllers`.
- Implement three handlers:
  - `createPaymentQrHandler`
  - `handleSepayWebhook`
  - `verifyPaymentHandler`
- Controllers only: validation, user resolution, service invocation, error mapping, and response formatting.

## Endpoints & Responses
1) **Create QR**
- `POST /api/payments/:bookingId/qr`
- Middleware: `authenticate -> requireRole(CUSTOMER) -> validate(createQrValidator)`
- Success (201):
  - `paymentTransactionId`
  - `qrString`
  - `expiresAt`

2) **SePay Webhook**
- `POST /api/payments/webhooks/sepay`
- Signature verification: handled in Task 14 middleware.
- Success: `200 OK` with **empty body**.
- Invalid signature: `401` (empty body or standard error payload; preferred empty body + log).

3) **Verify**
- `POST /api/payments/verify`
- Middleware: `authenticate -> requireRole(CUSTOMER) -> validate(verifyValidator)`
- Success (200): **payment-only fields** (no booking status)
  - `paymentTransactionId`
  - `paymentStatus`
  - `paidAt`
  - `provider`
  - `amount`
  - `currency`

## Error Handling
- Service errors: map to `res.fail({ code, message }, status)`.
- Zod errors: `VALIDATION_ERROR` with `details` array (field/message) and HTTP 400.
- Unexpected errors: log and return `INTERNAL_ERROR` with HTTP 500.

## Logging
- Use shared logger; log non-PII.
- Webhook handler logs `payment_webhook_received` with provider and booking/payment identifiers if available.
- Do not log secrets, signatures, or full payloads.

## Notes
- Keep controller logic minimal and consistent with `booking.controller.ts` patterns.
- No changes to routes or middleware in this task (handled in Task 10/14).
