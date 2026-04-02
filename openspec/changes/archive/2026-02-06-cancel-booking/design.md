## Context

SmartBadminton currently supports booking creation and payment state tracking, but it lacks a formal cancellation path for already paid bookings. The Phase 1 scope explicitly excludes payment-gateway refund APIs, so cancellation must still persist a deterministic refund decision and create an internal/manual refund record for operations follow-up.

Key constraints:
- Only authenticated `CUSTOMER` can cancel their own booking.
- Only `PAID` bookings are cancellable in this flow.
- Refund policy is time-based with Vietnam timezone (`Asia/Ho_Chi_Minh`): cancel at least 24 hours before `startTime` => 70% refund; otherwise no refund.
- API responses and error codes must stay deterministic and aligned with existing booking conventions.

## Goals / Non-Goals

**Goals:**
- Provide a single cancel-booking API flow with strict eligibility checks (auth, ownership, status).
- Persist cancellation metadata on booking and create exactly one linked `RefundTransaction` in the same transaction.
- Compute refund policy/amount consistently using configured threshold and timezone.
- Preserve auditability and operational visibility via logs, metrics, audit events, and in-app notification hooks.

**Non-Goals:**
- Direct integration with external payment gateways (Stripe/MoMo/ZaloPay/VNPAY) in this phase.
- Reversal or modification of booking payment settlement workflows.
- Supporting cancellation by non-customer roles (staff/admin/owner) in this endpoint.

## Decisions

### Decision 1: Enforce cancellation rules in service layer, not controller
- **Choice:** Put ownership/status/policy logic in `cancel-booking.service.ts` and keep controller thin.
- **Rationale:** Keeps business rules centralized and testable; aligns with existing bookings module layering.
- **Alternatives considered:**
  - Put checks in controller: rejected because it duplicates logic and weakens reusability.
  - Push logic into repository: rejected because repository should focus on persistence, not policy.

### Decision 2: Transactional update for booking + refund record
- **Choice:** Update booking to `CANCELED` and create `RefundTransaction` in one DB transaction.
- **Rationale:** Prevents partial state (canceled booking without refund record, or vice versa) and simplifies recovery.
- **Alternatives considered:**
  - Two separate writes: rejected due to inconsistency risk.
  - Async refund record creation: rejected in Phase 1 because it complicates idempotency and audit expectations.

### Decision 3: Policy calculation by configured constants with GMT+7 semantics
- **Choice:** Use env-backed config (`BOOKING_CANCEL_REFUND_RATE`, `BOOKING_CANCEL_MIN_HOURS_FOR_REFUND`, timezone) and exact 24-hour threshold.
- **Rationale:** Makes policy auditable and adjustable without code redesign while honoring agreed business rule.
- **Alternatives considered:**
  - Hard-coded values: rejected due to poor operational flexibility.
  - Calendar-day policy: rejected because requirement is exact hour-based threshold.

### Decision 4: Deterministic conflict/idempotency handling
- **Choice:** Return explicit business errors for non-cancellable states, including repeated cancel attempts.
- **Rationale:** Stable client behavior and clearer operator troubleshooting.
- **Alternatives considered:**
  - Silent success for repeated cancels: rejected because it hides domain conflicts.

### Decision 5: Phase 1 manual refund lifecycle states
- **Choice:** Create internal refund record with policy/amount/status to feed manual ops process.
- **Rationale:** Delivers business value now without payment gateway dependency while preserving future integration path.
- **Alternatives considered:**
  - No refund record in Phase 1: rejected because operations lose traceability.

## Risks / Trade-offs

- **Timezone boundary bugs around exact 24h** -> Mitigate with explicit timezone-aware tests at boundary and near-boundary times.
- **Race conditions on concurrent cancel attempts** -> Mitigate with transactional checks and unique refund transaction per booking.
- **Policy drift between docs and implementation** -> Mitigate by validating against TDD scenarios and updating OpenAPI + ops docs in same change.
- **Manual refund operational delay** -> Mitigate with clear `refundStatus` defaults, audit events, and dashboard/queue follow-up in later phases.

## Migration Plan

1. Deploy Prisma schema changes (booking cancellation fields + `RefundTransaction`).
2. Roll out API/service/controller/repository changes and route wiring.
3. Update API docs and operational runbook for manual refund handling.
4. Monitor logs/metrics for cancel flow outcomes after release.

Rollback strategy:
- If API behavior is unstable, disable cancel endpoint route and redeploy previous backend build.
- Keep schema additions in place (backward-compatible additive fields/models) and ignore new fields until fix release.

## Open Questions

- Do we need a strict SLA for transitioning `refundStatus` from initial manual state to completed/rejected in Phase 1 operations?
- Should in-app notification template include refund amount/policy breakdown immediately, or only cancellation confirmation in this phase?