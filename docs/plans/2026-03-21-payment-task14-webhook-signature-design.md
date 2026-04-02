# Payment Task 14.1 Design: SePay Webhook Signature Middleware

## Goal
Add a dedicated middleware that validates SePay IPN signature for the webhook endpoint and rejects invalid requests with `401` and an empty body.

## Scope
- Only apply to `POST /api/payments/webhooks/sepay`.
- Reuse existing signature validation logic from `SepayProvider.validateSignature`.
- Keep controller/service behavior unchanged.

## Approach (Chosen)
Create `validateSepayWebhookSignature` in `backend/src/modules/payments/middleware` and wire it into the SePay webhook route.

## Middleware Behavior
- Build a `PaymentWebhookContext` from `req.headers` and `req.body`.
- Call `SepayProvider.validateSignature(context)`.
- If invalid: `res.status(401).end()` (empty body), no extra logging of secrets.
- If valid: `next()`.

## Route Wiring
- Add middleware in `backend/src/routes/payment.routes.ts` for the SePay webhook route:
  - `router.post("/webhooks/sepay", validateSepayWebhookSignature, handleSepayWebhook)`.

## Error Handling
- Middleware returns `401` empty body on invalid signature.
- Controller remains as-is; if service still rejects, it returns `401` empty body (defensive).

## Testing
- Unit test for middleware:
  - Missing/invalid `Authorization` -> `401` + `end()`.
  - Valid header -> `next()` called.
- Route-level test (optional):
  - `/webhooks/sepay` returns `401` when missing/invalid header.

## Risks & Mitigations
- Logic drift: mitigated by reusing `SepayProvider.validateSignature` as single source of truth.

## Notes
- No changes to OpenAPI needed (webhook response remains `200` on success, `401` on invalid signature).
