# Payment Task 10 Routes Design

**Date:** 2026-03-21

## Goal
Wire payment routes for QR creation, SePay webhook, and verify, using middleware-based validation and existing auth/role guards.

## Scope
- Add `backend/src/routes/payment.routes.ts`.
- Add payment validation middleware (params + body) dedicated to payment routes.
- Mount payment routes in `backend/src/app.ts`.

## Middleware Stack
1) `POST /api/payments/:bookingId/qr`
- `authenticate`
- `requireRole(CUSTOMER)`
- `validatePaymentRequest(createPaymentQrValidator)` (params only)
- `createPaymentQrHandler`

2) `POST /api/payments/verify`
- `authenticate`
- `requireRole(CUSTOMER)`
- `validatePaymentRequest(verifyPaymentValidator)` (body only)
- `verifyPaymentHandler`

3) `POST /api/payments/webhooks/sepay`
- (Signature middleware in Task 14)
- `handleSepayWebhook`

## Validation Middleware
- New helper: `validatePaymentRequest(schema)` in `backend/src/modules/payments/middleware/validate-payment-request.ts`.
- Schema input includes `{ params, body }` so Zod can validate both sources.
- On success: reassign `req.params` and `req.body` with parsed values.
- On failure: respond `VALIDATION_ERROR` with details (same shape as existing validate middleware).

## Mounting
- Mount router in `backend/src/app.ts` at `/api/payments`.

## Notes
- Keep webhook route outside auth middleware.
- This task does not implement signature verification (Task 14).
