# Payment Task 18.3 Design - OpenAPI SePay Webhook

Date: 2026-03-22

## Summary
Add OpenAPI documentation for `POST /api/payments/webhooks/sepay` in `docs/api/payments.yaml` mirroring the codebase signature validation behavior.

## Scope
- Update `docs/api/payments.yaml` with the SePay webhook endpoint.

## Security
- Use `apiKey` security scheme with header `Authorization` format `Apikey <SEPAY_IPN_API_KEY>`.

## Request
- JSON body with SePay IPN payload fields:
  - `payment_code`, `content`, `transaction_content`, `amount`, `transfer_type`, `transaction_id`, `transaction_date`

## Response
- `200` with empty body on success
- `401` with empty body on invalid signature
- `500` ErrorResponse for unexpected server error

## Non-Goals
- No runtime code changes

## Testing
- No tests required for documentation-only change
