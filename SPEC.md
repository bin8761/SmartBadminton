# SmartBadminton Payments

## Overview
We need a payment flow after booking creation. Users create a booking, then click "Pay" to initiate a MOMO sandbox payment session. The system confirms payment via webhook plus client callback (server verification). Unpaid bookings expire after 10 minutes using a dedicated payment-timeout worker.

**Target users:** customers booking courts.

**Success criteria:**
- Payment session created only for `PENDING_PAYMENT` bookings.
- Webhook + verify correctly mark bookings as `PAID`.
- Unpaid bookings auto-expire after 10 minutes.
- Logs make it easy to pinpoint failures.

## Product Requirements
### MVP (Must Have)
- Create payment session on user click for `PENDING_PAYMENT` booking.
- MOMO sandbox integration with payUrl redirect.
- Webhook endpoint with signature verification.
- Client callback verify endpoint (server-side verification).
- PaymentTransaction persistence linked 1:1 to Booking.
- Dedicated payment-timeout worker/queue.
- Structured logging for each payment step.

### Out of Scope (Phase 1)
- Production MOMO credentials.
- Additional payment gateways (ZaloPay/VNPAY/Stripe).
- Automated refund processing.

### User Flow
1. User creates booking (status `PENDING_PAYMENT`).
2. User clicks Pay.
3. Server creates payment session, returns `payUrl`.
4. User completes payment on MOMO.
5. MOMO sends webhook to server.
6. Server verifies and updates `PaymentTransaction` + `Booking`.
7. If no payment after 10 minutes, timeout worker marks booking `EXPIRED`.

## Technical Architecture
### System Type
Backend feature in existing Express/Prisma monolith.

### Architecture Pattern
Provider-plugin architecture:
- `PaymentProvider` interface + registry
- MOMO adapter for sandbox
- Payment service for flow coordination
- Dedicated payment-timeout worker

### Tech Stack
- Backend: Node.js, Express, TypeScript
- DB: PostgreSQL via Prisma
- Queue/Worker: BullMQ + Redis
- Validation: Zod
- Logging: pino

## System Maps
### Architecture Diagram (ASCII)

```
Client -> POST /api/payments/:bookingId/session -> PaymentService -> MOMO create -> payUrl
Client -> MOMO pay -> MOMO webhook -> /api/payments/webhooks/momo -> PaymentService -> DB
Client -> /api/payments/verify -> PaymentService -> MOMO verify -> DB
Worker (payment-timeout) -> DB -> Booking EXPIRED
```

### Data Model Relations
```
Booking 1--1 PaymentTransaction
```

### Status Transitions
```
PENDING_PAYMENT -> PAID (webhook/verify)
PENDING_PAYMENT -> EXPIRED (timeout worker)
```

## Data Model
**PaymentTransaction**
- `bookingId` (unique, FK)
- `provider` (MOMO)
- `status` (PENDING, SUCCEEDED, FAILED, EXPIRED, CANCELED)
- `amount`, `currency`
- `externalOrderId`, `externalRequestId`
- `payUrl`
- `meta` (JSON)
- `paidAt`, `createdAt`, `updatedAt`

Indexes:
- Unique: `(provider, externalOrderId)`
- Index: `(status, createdAt)`

## API Endpoints
- `POST /api/payments/:bookingId/session`
  - Preconditions: booking is `PENDING_PAYMENT`, owner matches
  - Response: `paymentUrl`, `paymentTransactionId`, `expiresAt`

- `POST /api/payments/webhooks/momo`
  - Validates signature
  - Updates `PaymentTransaction` + `Booking`

- `POST /api/payments/verify`
  - Server-side verify with provider
  - Updates `PaymentTransaction` + `Booking`

## Error Handling & Idempotency
- Idempotent by `externalOrderId` / `externalRequestId`.
- Webhook duplicates should not double-apply.
- If webhook success arrives after booking expired, record payment success and mark refund manual.

Standard errors:
- `BOOKING_NOT_FOUND`
- `BOOKING_NOT_OWNED`
- `BOOKING_STATUS_NOT_PAYABLE`
- `PAYMENT_SESSION_EXISTS`
- `PAYMENT_PROVIDER_ERROR`
- `INVALID_SIGNATURE`

## Logging & Observability
- Correlation ID per flow (use `bookingId` or `paymentFlowId`).
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

## File Structure
```
backend/src/modules/payments/
  controllers/
  providers/
  repositories/
  services/
  types/
  validators/
backend/src/workers/payment-timeout.*
backend/src/routes/payment.routes.ts
```

## Development Phases
- [ ] Phase 1: Add PaymentTransaction model + migration
- [ ] Phase 2: Implement MOMO sandbox adapter + provider registry
- [ ] Phase 3: Implement payment endpoints + validation
- [ ] Phase 4: Implement payment-timeout worker
- [ ] Phase 5: Add logging/metrics + OpenAPI docs
- [ ] Phase 6: Tests (unit + integration)

## Open Questions
None for Phase 1.

---

## References
- Design source: `docs/plans/2026-03-09-payment-design.md`
- Implementation plan: `docs/plans/2026-03-09-payment-implementation-plan.md`
