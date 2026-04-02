# Payment Task 16.2 Design - Structured Logs

Date: 2026-03-22

## Summary
Add structured logs for QR creation, webhook handling, verification, and success/failure outcomes in payment flow. Use consistent event naming to improve traceability.

## Naming Convention
Event name pattern: `payment.<stage>.<outcome>`

Examples:
- `payment.qr.create.requested`
- `payment.qr.create.succeeded`
- `payment.qr.create.failed`
- `payment.webhook.received`
- `payment.webhook.processed`
- `payment.verify.requested`
- `payment.verify.succeeded`
- `payment.verify.failed`

## Scope
- Add log events at key points in payment service and controller.
- Keep existing log messages; add new structured events as needed.
- No behavior changes.

## Log Points
Service layer:
- QR create: requested, succeeded, failed
- Webhook: received, processed
- Verify: requested, succeeded, failed
- Outcome logs for PAID/FAILED/EXPIRED branches

Controller layer:
- Optional entry-point received logs for webhook/verify/qr create to trace request boundaries

## Structured Payload
Common fields:
- `bookingId`
- `paymentTransactionId`
- `provider`

Optional fields by context:
- `paymentStatus`
- `amount`
- `currency`
- `paidAt`
- `reason` (failure reason or branch name)

## Non-Goals
- No schema changes
- No logging framework changes
- No sensitive body payload logging

## Testing
- No new tests required; update any log assertions if present.
