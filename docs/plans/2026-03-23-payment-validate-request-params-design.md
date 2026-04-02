# Fix Express Params Type Mismatch Design

Date: 2026-03-23

## Summary
Align payment validation middleware types with Express `ParamsDictionary` to fix TS2322.

## Scope
- Update `backend/src/modules/payments/middleware/validate-payment-request.ts` only.

## Approach
- Use `ParamsDictionary` for `params` in `PaymentRequestShape`.

## Non-Goals
- No behavior changes.

## Testing
- No tests added.
