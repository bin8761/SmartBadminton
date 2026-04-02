**Scope & Planning**
- [ ] Task 1: Confirm implementation scope for `cancel-booking` is Phase 1 only (no external payment gateway), and freeze API contract/error catalog from `TDD/cancel-booking-tdd.md`.
- [ ] Task 2: Create working folder/files if missing under `backend/src/modules/bookings/` for cancel flow (`controllers`, `services`, `repositories`, `validators`, `types`).

**Database & Prisma**
- [x] Task 3: Update `backend/prisma/schema.prisma` `Booking` model with cancellation/refund fields: `canceledAt`, `canceledBy`, `cancelReason`, `refundPolicy`, `refundAmount`, `refundStatus`. (Completed)
- [x] Task 4: Add relation for `canceledBy` (to `User`) using project pattern (named relation to avoid ambiguity). (Completed)
- [x] Task 5: Add new `RefundTransaction` model with fields from TDD (`bookingId`, `amount`, `currency`, `policy`, `status`, `source`, `note`, timestamps). (Completed)
- [x] Task 6: Add indexes for cancellation/refund queries (`Booking(status,startTime)`, `Booking(userId,status,createdAt)`, `RefundTransaction(status,createdAt)`, unique `RefundTransaction(bookingId)` if one-per-booking). (Completed)
- [x] Task 7: Generate and review Prisma migration SQL for the above schema changes.
- [x] Task 8: Update `backend/prisma/seed.ts` with sample `PAID` bookings to cover both refund scenarios (`>=24h`, `<24h`) and one non-cancellable status case. (Completed)

**Domain Types & Constants**
- [x] Task 9: Add enums/constants for `RefundPolicy` and `RefundStatus` in bookings module (or shared constants if project convention prefers). (Completed)
- [x] Task 10: Add cancellation policy config defaults (`BOOKING_CANCEL_REFUND_RATE=0.7`, `BOOKING_CANCEL_MIN_HOURS_FOR_REFUND=24`, timezone constant `Asia/Ho_Chi_Minh`). (Completed)

**Validation Layer**
- [x] Task 11: Create validator `backend/src/modules/bookings/validators/cancel-booking.validator.ts` for `bookingId` UUID param and `reason` (required, trimmed, 10-500 chars). (Completed)
- [x] Task 12: Add validator unit tests for boundary lengths, whitespace-only input, missing reason, and invalid UUID. (Completed)

**Repository Layer**
- [x] Task 13: Implement repository methods to load booking by id, verify ownership/status context, and execute transactional update. (Completed)
- [x] Task 14: Implement repository method to create `RefundTransaction` row linked to booking in the same transaction. (Completed)
- [x] Task 15: Add repository tests for atomicity (booking update + refund row create) and unique constraint behavior.

**Service Layer**
- [x] Task 16: Implement `cancel-booking.service.ts` to enforce rules: role context, owner check, `status=PAID`, deterministic conflict handling. (Completed)
- [x] Task 17: Implement refund calculator utility using GMT+7 and exact 24-hour threshold; output `REFUND_70` or `NO_REFUND`. (Completed)
- [x] Task 18: In service transaction, update booking to `CANCELED`, persist cancellation metadata, and create internal/manual `RefundTransaction`. (Completed)
- [x] Task 19: Implement idempotent business behavior for repeated cancel attempts (`BOOKING_ALREADY_CANCELED` / `BOOKING_STATUS_NOT_CANCELLABLE`). (Completed)
- [x] Task 20: Add service unit tests for all decision branches (owner/non-owner, paid/non-paid, boundary exactly 24h, less than 24h).

**Controller & Routing**
- [x] Task 21: Add `cancelBookingHandler` in `backend/src/modules/bookings/controllers/booking.controller.ts` using shared response/error conventions. (Completed)
- [x] Task 22: Wire route `POST /api/bookings/:bookingId/cancel` in `backend/src/routes/booking.routes.ts` with middleware chain: `authenticate` -> `requireRole(CUSTOMER)` -> `validate(cancelBooking)` -> handler. (Completed)
- [x] Task 23: Ensure route is mounted (if needed) in `backend/src/app.ts` consistently with existing booking routes. (Completed)

**Error Handling & Contracts**
- [x] Task 24: Implement error code mapping and messages exactly as agreed: `BOOKING_NOT_FOUND`, `BOOKING_NOT_OWNED`, `BOOKING_STATUS_NOT_CANCELLABLE`, `BOOKING_ALREADY_CANCELED`, `INVALID_CANCEL_REASON`, `INTERNAL_ERROR`. (Completed)
- [x] Task 25: Ensure `<24h` scenario returns `200` with `refundAmount=0`, `refundPolicy=NO_REFUND`, and appropriate `refundStatus`. (Completed)

**Observability, Audit, Notification**
- [x] Task 26: Add structured logs for `booking_cancel_requested`, `booking_canceled`, `booking_cancel_rejected` (without leaking sensitive `reason` content). (Completed)
- [x] Task 27: Add/extend audit events for `BOOKING_CANCEL_ATTEMPT` and `BOOKING_CANCELED`. (Completed)
- [x] Task 28: Add metrics (`bookings_canceled_total{result,refund_policy}`, `bookings_cancel_latency_ms`, `refund_manual_pending_total`). (Completed)
- [x] Task 29: Integrate in-app notification creation after successful cancel (sync or existing internal mechanism). (Completed)

**API Docs & Tests**
- [x] Task 30: Update `docs/api/bookings.yaml` with `POST /api/bookings/:bookingId/cancel` request/response/error schemas. (Completed)
- [x] Task 31: Add integration tests (Supertest) for success paths (`>=24h`, `<24h`) and failure paths (`404`, `403`, `409`, `400`).
- [x] Task 32: Add contract/schema assertions for success and error payload structure. (Completed)
- [x] Task 33: Update operational docs (`docs/ops.md` and/or `docs/setup.md`) for new env configs and manual refund workflow notes. (Completed)

**Final Verification**
- [x] Task 34: Run test suite for touched modules and verify no regression on existing booking flows.
- [x] Task 35: Perform final checklist review against TDD requirements (functional + NFR + observability + docs) before implementation sign-off.
