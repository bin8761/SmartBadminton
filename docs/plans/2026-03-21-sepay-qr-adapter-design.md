# SePay QR Adapter Design (Task 5)

## Summary
Implement a SePay payment provider adapter that generates QR URLs for in-app display, validates IPN signatures, parses IPN payloads to map bookings, and supports verify via SePay transaction APIs.

## Goals
- Generate QR URL using SePay QR image endpoint.
- Validate IPN signature using `Authorization: Apikey ...` header.
- Map incoming IPN payloads to bookings via `payment_code` or `content`.
- Provide `verify` method to query SePay transaction API when needed.

## Non-Goals
- Full service/controller integration (handled in later tasks).
- Production hardening beyond basic signature checks.

## Data Mapping
- Transfer content format: `SB_<bookingId>`.
- Booking ID resolution: `payment_code` if present, fallback to parse from `content`.

## QR Generation
- URL: `https://qr.sepay.vn/img?acc={SEPAY_BANK_ACCOUNT}&bank={SEPAY_BANK_NAME}&amount={amount}&des={SB_<bookingId>}`
- `qrString` returned as URL.

## IPN Validation
- Expect header: `Authorization: Apikey {SEPAY_IPN_API_KEY}`.
- Return `false` if missing/mismatch.

## IPN Handling
- Parse fields from payload:
  - `payment_code`, `content`, `amount`, `transfer_type`, `transaction_id`, `transaction_date`.
- Set status:
  - `PAID` if `transfer_type=credit` and `amount>0`.
  - Otherwise `FAILED`.

## Verify
- Use Bearer token to call:
  - `GET /v1/transaction` (list) or
  - `GET /v1/transaction/{transaction_id}`.
- Return `PaymentVerifyResult` based on response.

## Required Env Vars
- `SEPAY_BANK_ACCOUNT`
- `SEPAY_BANK_NAME`
- `SEPAY_IPN_API_KEY`
- `SEPAY_API_BASE_URL`

## Open Questions
- None.
