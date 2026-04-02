# Payment Task 16.1 Design - Correlation IDs In Logs

Date: 2026-03-22

## Summary
Add structured correlation identifiers to payment logs in service and controller layers to improve traceability across booking/payment flows.

## Scope
- Add `bookingId` and `paymentTransactionId` fields to log payloads in payment service and controller.
- Keep existing log messages and error handling unchanged.

## Non-Goals
- No new logging framework or logger context refactor.
- No schema changes or behavioral changes to payment logic.

## Approach
- Use structured fields (separate keys) rather than a single concatenated string.
- Populate both IDs when available; leave missing fields as `undefined` or omit if not known at that point.
- Apply consistently to key log events in:
  - `backend/src/modules/payments/services/payment.service.ts`
  - `backend/src/modules/payments/controllers/payment.controller.ts`

## Log Points
Service (examples):
- `payment_qr_created`
- `payment_timeout_enqueued`
- `enqueue payment timeout failed`
- `payment_late_webhook_refund_required`
- Any error logs in payment service (if present)

Controller (examples):
- `create payment qr failed`
- `payment webhook failed`
- `verify payment failed`

## Data Handling
- Use `bookingId` from request/booking context.
- Use `paymentTransactionId` from payment transaction results when available.
- Do not log sensitive payload content beyond IDs and existing fields.

## Testing
- No new tests required; changes are additive to log payloads only.
- If any log payloads are asserted in tests, update expected fields accordingly.
