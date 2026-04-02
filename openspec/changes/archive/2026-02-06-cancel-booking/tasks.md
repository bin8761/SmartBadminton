## 1. Scope and baseline

- [x] 1.1 Confirm Phase 1 scope for cancel-booking (no external payment gateway) and freeze API/error catalog from `TDD/cancel-booking-tdd.md`.
- [x] 1.2 Ensure cancel-flow folders/files exist under `backend/src/modules/bookings/`.

## 2. Database and schema

- [x] 2.1 Add booking cancellation/refund fields in `backend/prisma/schema.prisma` (`canceledAt`, `canceledBy`, `cancelReason`, `refundPolicy`, `refundAmount`, `refundStatus`).
- [x] 2.2 Add named relation from `Booking.canceledBy` to `User`.
- [x] 2.3 Add `RefundTransaction` model and booking relation.
- [x] 2.4 Add indexes for cancellation/refund query paths and unique refund-per-booking rule.
- [x] 2.5 Generate and review Prisma migration SQL for cancel-booking schema changes.
- [x] 2.6 Update seed data with paid bookings covering `>=24h`, `<24h`, and non-cancellable status case.

## 3. Domain constants and configuration

- [x] 3.1 Add refund enums/constants (`RefundPolicy`, `RefundStatus`) in bookings module.
- [x] 3.2 Add policy config defaults (`BOOKING_CANCEL_REFUND_RATE`, `BOOKING_CANCEL_MIN_HOURS_FOR_REFUND`, `BOOKING_CANCEL_TIMEZONE`).

## 4. Validation layer

- [x] 4.1 Create `cancel-booking.validator.ts` for UUID `bookingId` and `reason` validation (required, trimmed, 10-500 chars).
- [x] 4.2 Add validator unit tests for boundary length, whitespace-only reason, missing reason, invalid UUID.

## 5. Repository layer

- [x] 5.1 Implement repository read methods for booking lookup and ownership/status context.
- [x] 5.2 Implement transactional repository method to update booking cancellation fields and create linked `RefundTransaction`.
- [x] 5.3 Add repository tests for atomicity and unique refund-transaction behavior.

## 6. Service layer

- [x] 6.1 Implement `cancel-booking.service.ts` with ownership check, `PAID`-only rule, and deterministic conflict handling.
- [x] 6.2 Implement refund calculator using `Asia/Ho_Chi_Minh` and exact 24-hour threshold.
- [x] 6.3 Persist cancellation metadata and internal/manual refund record in one transaction.
- [x] 6.4 Implement repeated-cancel behavior mapping (`BOOKING_ALREADY_CANCELED` / `BOOKING_STATUS_NOT_CANCELLABLE`).
- [x] 6.5 Add service unit tests for all key branches and boundary times.

## 7. Controller and routing

- [x] 7.1 Add `cancelBookingHandler` in `backend/src/modules/bookings/controllers/booking.controller.ts`.
- [x] 7.2 Wire `POST /api/bookings/:bookingId/cancel` with `authenticate -> requireRole(CUSTOMER) -> validate(cancelBooking) -> handler`.
- [x] 7.3 Ensure booking route mounting in `backend/src/app.ts` remains consistent.

## 8. Error contract and response semantics

- [x] 8.1 Implement agreed error-code mapping: `BOOKING_NOT_FOUND`, `BOOKING_NOT_OWNED`, `BOOKING_STATUS_NOT_CANCELLABLE`, `BOOKING_ALREADY_CANCELED`, `INVALID_CANCEL_REASON`, `INTERNAL_ERROR`.
- [x] 8.2 Ensure `<24h` cancellation returns success with `refundAmount=0`, `refundPolicy=NO_REFUND`, and proper refund status.

## 9. Observability and operations

- [x] 9.1 Add structured logs: `booking_cancel_requested`, `booking_canceled`, `booking_cancel_rejected` (without sensitive reason leakage).
- [x] 9.2 Add audit events: `BOOKING_CANCEL_ATTEMPT` and `BOOKING_CANCELED`.
- [x] 9.3 Add metrics: `bookings_canceled_total{result,refund_policy}`, `bookings_cancel_latency_ms`, `refund_manual_pending_total`.
- [x] 9.4 Create in-app notification on successful cancellation.

## 10. API docs and integration tests

- [x] 10.1 Update `docs/api/bookings.yaml` for `POST /api/bookings/:bookingId/cancel` request/response/error schemas.
- [x] 10.2 Add integration tests for success paths (`>=24h`, `<24h`) and failure paths (`404`, `403`, `409`, `400`).
- [x] 10.3 Add response contract assertions for both success and error payloads.
- [x] 10.4 Update `docs/ops.md` and/or `docs/setup.md` for cancel-booking env and manual refund workflow.

## 11. Final verification

- [x] 11.1 Run affected test suites and verify no regression in existing booking flows.
- [x] 11.2 Perform final checklist review against `TDD/cancel-booking-tdd.md` (functional, NFR, observability, docs).
