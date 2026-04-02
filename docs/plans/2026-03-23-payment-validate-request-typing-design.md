# Fix Zod v4 Payment Validation Middleware Design

Date: 2026-03-23

## Summary
Update payment validation middleware typing so Zod v4 `parse` result is not `unknown`, resolving TS18046 errors.

## Scope
- Modify `backend/src/modules/payments/middleware/validate-payment-request.ts` only.

## Approach
- Replace `ZodSchema` with `ZodType<PaymentRequestShape>`.
- Define `PaymentRequestShape` with optional `params` and `body`.
- Keep runtime logic unchanged.

## Non-Goals
- No behavior changes to validation logic.

## Testing
- No new tests required.
