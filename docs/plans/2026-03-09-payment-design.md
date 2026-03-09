# Payment Flow Design (MOMO Sandbox, Open Architecture)

## Summary
This design adds a payments module with a provider-plugin architecture. Phase 1 integrates MOMO in sandbox, while keeping abstractions open for future gateways. Payments are initiated only when the user clicks "Pay" on a `PENDING_PAYMENT` booking. Confirmation is done via webhook plus client callback (server-verified). A dedicated payment-timeout worker expires unpaid bookings after 10 minutes.

## Goals
- Support payment after booking creation (user-initiated).
- MOMO sandbox first, but architecture open for multiple gateways.
- Reliable confirmation via webhook and server verification.
- Clear logging to pinpoint errors in the flow.
- Separate payment timeout worker for scale and SRP.

## Non-Goals
- Production MOMO integration in this phase.
- Implementing other gateways (ZaloPay/VNPAY/Stripe) now.
- Real-time refunds automation (manual handling only if conflict occurs).

## Architecture
- New module `payments` with controller/service/repo/validators/types.
- `PaymentProvider` interface and `PaymentProviderRegistry`.
- MOMO adapter implements `PaymentProvider`.
- Webhook route per provider: `/api/payments/webhooks/momo`.
- Client callback verify route: `/api/payments/verify`.
- Dedicated `payment-timeout` worker/queue.

## Data Model
Introduce `PaymentTransaction`:
- `id` (UUID)
- `bookingId` (FK, unique)
- `provider` (enum)
- `status` (enum: `PENDING`, `SUCCEEDED`, `FAILED`, `EXPIRED`, `CANCELED`)
- `amount`, `currency`
- `externalOrderId`, `externalRequestId`
- `payUrl`
- `meta` (JSON, provider-specific)
- `paidAt`, `createdAt`, `updatedAt`

Relations:
- `Booking` 1--1 `PaymentTransaction`

Indexes:
- Unique: `(provider, externalOrderId)`
- Index: `(status, createdAt)`

## API & Flow
1) Create payment session
- `POST /api/payments/:bookingId/session`
- Preconditions: booking is `PENDING_PAYMENT`, owner matches.
- Response: `paymentUrl`, `paymentTransactionId`, `expiresAt`.

2) Webhook
- `POST /api/payments/webhooks/momo`
- Validate signature; update `PaymentTransaction` and `Booking`.

3) Client callback verify
- `POST /api/payments/verify`
- Server verifies with provider; update status.

4) Booking status transitions
- `PENDING_PAYMENT` on creation
- `PAID` on confirmed payment
- `EXPIRED` when timeout occurs

## Error Handling & Idempotency
- Idempotent by `externalOrderId` or `externalRequestId`.
- Repeated webhooks should not double-apply.
- If webhook success arrives after booking expired, record payment success and mark refund as manual (future handling).
- Standard errors: `BOOKING_NOT_FOUND`, `BOOKING_NOT_OWNED`, `BOOKING_STATUS_NOT_PAYABLE`, `PAYMENT_SESSION_EXISTS`, `PAYMENT_PROVIDER_ERROR`, `INVALID_SIGNATURE`.

## Worker/Timeout
- Queue: `payment` with job `payment_timeout`.
- Schedule after 10 minutes on booking creation.
- Worker: if still `PENDING_PAYMENT`, mark booking `EXPIRED` and `PaymentTransaction.status=EXPIRED`.
- Config: `PAYMENT_TIMEOUT_MINUTES=10`.

## Logging/Observability
- Correlation ID for end-to-end flow (use `bookingId` or `paymentFlowId`).
- Event logs:
  - `payment_session_created`
  - `payment_redirected`
  - `payment_webhook_received`
  - `payment_verified`
  - `payment_succeeded`
  - `payment_expired`
  - `payment_failed`
- Error logs:
  - `payment_provider_error`
  - `payment_signature_invalid`
  - `payment_state_conflict`
- Do not log sensitive fields (signatures, tokens, PII).

## Testing
- Unit: provider selection, state transitions.
- Integration: session creation, webhook success, timeout expiry.
- Contract/OpenAPI updates for payment endpoints.

## Open Questions
- None for Phase 1 (MOMO sandbox, open architecture).
