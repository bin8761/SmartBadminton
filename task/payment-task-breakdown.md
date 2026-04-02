**Data & Schema**
- [x] Task 1: Add `PaymentTransaction` model and enums (`PaymentProvider`, `PaymentStatus`) in `backend/prisma/schema.prisma`.
- [x] Task 1.1: Update `PaymentProvider` enum to `SEPAY` and align payment fields for QR flow.
- [ ] Task 2.1: Generate Prisma migration for payment tables/indexes (depends on Task 1.1).
- [ ] Task 2.2: Review generated SQL for `PaymentTransaction` schema, constraints, and indexes (depends on Task 2.1).
- [ ] Task 2.3: Run migration in dev and confirm Prisma client is updated (depends on Task 2.2).

**Config & Dependencies**
- [x] Task 3: Add SePay env vars in `backend/src/config/env.ts` and `backend/.env.example` (QR dynamic + timeout).

**Payments Module**
- [x] Task 4: Create payment provider interface + registry in `backend/src/modules/payments/providers`.
- [x] Task 5: Implement SePay QR adapter in `backend/src/modules/payments/providers/sepay.provider.ts` (depends on Task 4).
- [x] Task 6: Add payment repository for `PaymentTransaction` CRUD in `backend/src/modules/payments/repositories` (depends on Task 1.1).
- [x] Task 7: Implement `paymentService` flow (create QR, verify, webhook handling, idempotency) in `backend/src/modules/payments/services` (depends on Tasks 4–6).

**API & Routing**
- [x] Task 8: Add validators with `zod` for QR create and verify endpoints in `backend/src/modules/payments/validators`.
- [x] Task 9: Implement controllers for QR creation, webhook handling, and verify in `backend/src/modules/payments/controllers` (depends on Task 7).
- [x] Task 10.1: Create payment request validation middleware to parse `{ params, body }` with Zod in `backend/src/modules/payments/middleware` (depends on Task 8).
- [x] Task 10.2: Add `payment.routes.ts` with routes for `/:bookingId/qr`, `/verify`, `/webhooks/sepay` and wire middleware stack (depends on Tasks 9, 10.1).
- [x] Task 10.3: Mount payment router at `/api/payments` in `backend/src/app.ts` (depends on Task 10.2).
- [x] Task 10.4: Add route-level tests for auth guard on payment routes in `backend/tests/modules/payments` (depends on Task 10.2).

**Worker & Queue**
- [x] Task 11.1: Add `payment` queue definition in `backend/src/shared/queue.ts`.
- [x] Task 11.2: Export payment queue helpers (enqueue/find/remove) in `backend/src/shared/queue.ts` (depends on Task 11.1).
- [x] Task 12.1: Create `payment-timeout` worker file to expire pending payments in `backend/src/workers` (depends on Task 11.2).
- [x] Task 12.2: Add worker runner/registration for payment timeout in app bootstrap or worker runner (depends on Task 12.1).
- [x] Task 12.3: Configure retry/backoff for payment-timeout jobs (depends on Task 12.1).
- [x] Task 13.1: Enqueue payment-timeout job when QR is created in payment flow (depends on Task 12.1).
- [x] Task 13.2: Enqueue payment-timeout job on booking creation if required by flow (depends on Task 12.1). (Not required; enqueue happens on QR creation)

**Security & Reliability**
- [x] Task 14.1: Add webhook signature validation middleware for SePay IPN (depends on Task 9).
- [x] Task 14.2: Wire signature middleware on `/api/payments/webhooks/sepay` and return `401` on invalid signature (depends on Task 14.1).
- [x] Task 15.1: Handle late webhook when booking already `EXPIRED` (mark payment as `PAID`? manual refund flag) in payment service (depends on Task 7).
- [x] Task 15.2: Persist manual refund marker or note for late webhook conflict (depends on Task 15.1).

**Observability**
- [x] Task 16.1: Add correlation ID (bookingId/paymentTransactionId) to payment logs in service/controller (depends on Task 7).
- [x] Task 16.2: Add structured logs for QR create, webhook received, verify, success/fail outcomes (depends on Task 7).
- [x] Task 17.1: Define payment metrics in `backend/src/shared/metrics.ts` (success/failure/latency) (depends on Task 7).
- [x] Task 17.2: Emit metrics at QR create, webhook, verify, timeout paths (depends on Task 17.1).

**Documentation**
- [x] Task 18.1: Add OpenAPI path for `POST /api/payments/:bookingId/qr` with request/response schema (depends on Task 10).
- [x] Task 18.2: Add OpenAPI path for `POST /api/payments/verify` with request/response schema (depends on Task 10).
- [x] Task 18.3: Add OpenAPI path for `POST /api/payments/webhooks/sepay` (depends on Task 10).
- [x] Task 19.1: Update `docs/setup.md` with payment env vars and QR/verify usage (depends on Task 3).
- [ ] Task 19.2: Update `docs/ops.md` with webhook handling and timeout worker notes (depends on Task 12).

**Testing**
- [ ] Task 20.1: Unit test `createPaymentQrService` happy path and existing pending reuse (depends on Task 7).
- [ ] Task 20.2: Unit test `handlePaymentWebhookService` idempotency and signature invalid path (depends on Task 7).
- [ ] Task 20.3: Unit test `verifyPaymentService` status transitions (depends on Task 7).
- [ ] Task 21.1: Integration test QR creation endpoint (auth + validation + success) (depends on Tasks 9–10).
- [ ] Task 21.2: Integration test webhook success path updates booking/payment (depends on Tasks 9–12).
- [ ] Task 21.3: Integration test payment timeout expiry flow (depends on Tasks 12–13).
- [ ] Task 22.1: Add contract tests for payment endpoint schemas (depends on Task 18).

**Open Questions**
- [ ] Task 23.1: Decide refund handling for late webhook success (manual refund workflow details).
- [ ] Task 23.2: Document decision and update service logic if needed (depends on Task 23.1).
