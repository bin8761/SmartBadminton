# Payment Task 18.1 Design - OpenAPI QR Endpoint

Date: 2026-03-22

## Summary
Add OpenAPI documentation for `POST /api/payments/{bookingId}/qr` in a new `docs/api/payments.yaml` file.

## Scope
- Create new `docs/api/payments.yaml` file.
- Document only the QR creation endpoint.

## Security
- Require Bearer authentication (JWT) for the endpoint.

## Request
- Path parameter: `bookingId` (uuid)
- No request body

## Response
- `201` success with `paymentTransactionId`, `qrString`, `expiresAt`
- Error responses: `400`, `401`, `403`, `404`, `409`, `500` with shared `ErrorResponse` schema

## Non-Goals
- No changes to runtime code
- No other payment endpoints in this task

## Testing
- No tests required for documentation-only change
