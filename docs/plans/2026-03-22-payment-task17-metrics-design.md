# Payment Task 17.1 Design - Payment Metrics

Date: 2026-03-22

## Summary
Define payment metrics counters and latency histogram in `backend/src/shared/metrics.ts` to track payment success, failure, and latency.

## Metric Names
- `payments_success_total`
- `payments_failure_total`
- `payments_latency_ms`

## Labels
- `provider`
- `result` (for counters)
- `flow` (optional; `qr_create`, `webhook`, `verify`)

## Scope
- Define metrics only; emission/instrumentation is out of scope for Task 17.1.

## Non-Goals
- No service changes
- No metric emission wiring

## Testing
- No tests required for metric definitions only.
