# Payment Validators Design (Task 8)

## Summary
Add Zod validators for payment QR creation (path param only) and verify endpoint (body bookingId).

## Validators
- `createPaymentQrValidator`: validates `params.bookingId` as UUID; no body.
- `verifyPaymentValidator`: validates `body.bookingId` as UUID.

## Goals
- Enforce valid UUIDs.
- Keep request shapes minimal.

## Non-Goals
- Business logic validation (handled in service).
