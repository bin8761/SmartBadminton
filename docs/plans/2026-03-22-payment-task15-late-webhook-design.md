# Payment Task 15.1 Design: Late Webhook Handling (Expired Booking)

## Goal
Handle SePay webhook events that arrive after the payment/booking has expired by recording the payment as PAID and flagging a manual refund requirement, without reopening the booking.

## Scope
- Applies only to webhook flow in `handlePaymentWebhookService`.
- Booking remains `EXPIRED` on late PAID.
- Refund flag stored in `PaymentTransaction.meta`.

## Behavior
When webhook result is `PAID` and `booking.status === EXPIRED`:
- Update latest `PaymentTransaction`:
  - `status = PAID`
  - `paidAt = result.paidAt ?? new Date()`
  - `meta.refundRequired = true`
  - `meta.refundReason = "LATE_WEBHOOK_EXPIRED"`
- Do **not** change `Booking` status (stay `EXPIRED`).
- Log/audit a late-payment event without PII.

## Error Handling
- Signature invalid, booking not found, payment not found: unchanged from current logic.
- Late PAID path returns success (webhook still 200 OK).

## Testing
- Unit test for `handlePaymentWebhookService`:
  - If booking is `EXPIRED` and webhook is `PAID`, payment is updated to `PAID` with refund flag in `meta`, booking remains `EXPIRED`.

## Risks & Mitigations
- Late payments could accumulate: flagged in `meta` for ops review and manual refund.
- Logic drift: keep late-payment branch local to service to limit side effects.
