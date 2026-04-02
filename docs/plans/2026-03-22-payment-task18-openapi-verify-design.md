# Payment Task 18.2 Design - OpenAPI Verify Endpoint

Date: 2026-03-22

## Summary
Add OpenAPI documentation for `POST /api/payments/verify` in `docs/api/payments.yaml`.

## Scope
- Update `docs/api/payments.yaml` with the verify endpoint.

## Security
- Require Bearer authentication (JWT).

## Request
- Body: `{ bookingId: uuid }`

## Response
- `200` success with `paymentTransactionId`, `paymentStatus`, `paidAt`, `provider`, `amount`, `currency`
- Error responses: `400`, `401`, `403`, `404` (USER_NOT_FOUND, BOOKING_NOT_FOUND, PAYMENT_NOT_FOUND), `500`

## Non-Goals
- No runtime code changes

## Testing
- No tests required for documentation-only change
