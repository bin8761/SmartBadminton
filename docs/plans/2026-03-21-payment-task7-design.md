# Payment Service Flow Design (Task 7)

## Summary
Implement payment service flow for SePay QR dynamic: create QR, handle webhook, verify payments, and enforce idempotency. Booking updates that affect price/time/court should invalidate existing PENDING attempts and create a new QR.

## Goals
- Create QR for `PENDING_PAYMENT` bookings.
- Enforce at most one active PENDING attempt per booking.
- Handle webhook + verify idempotently by `externalOrderId`.
- Update booking/payment statuses consistently.

## Non-Goals
- Controller/route wiring (handled in Tasks 8–10).
- Full refund flows (handled later).

## Core Rules
- If a PENDING attempt exists and **no booking change**: return existing QR (no new attempt).
- If booking updates change **price/time/court**: mark existing PENDING as `FAILED` (or `EXPIRED`) and create a new QR.
- Webhook/verify are **idempotent**: if already processed, return current status without reprocessing.

## Flow: Create QR
1. Validate booking is `PENDING_PAYMENT` and owned by user.
2. Check for existing PENDING attempt:
   - If exists and booking unchanged → return its QR.
   - If exists and booking changed → update old attempt status, create new.
3. Call provider `createQr`.
4. Persist `PaymentTransaction` (PENDING) with `externalOrderId`, `qrString`.

## Flow: Handle Webhook
1. Validate signature.
2. Parse payload → resolve bookingId (payment_code/content).
3. If transaction already marked PAID/FAILED → return current state.
4. Update `PaymentTransaction` + `Booking`.

## Flow: Verify
1. Call provider `verify` using `externalOrderId`.
2. If already processed → return current state.
3. Update records based on verified status.

## Open Questions
- Exact status transitions on invalid webhook (likely no-op).
