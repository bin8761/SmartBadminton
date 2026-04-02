# Payment Task 17.2 Design - Emit Payment Metrics

Date: 2026-03-22

## Summary
Emit payment metrics for QR creation, webhook handling, verification, and timeout flows using shared metrics definitions.

## Labels
- `provider`: `SEPAY`
- `flow`: `qr_create`, `webhook`, `verify`, `timeout`
- `result`: `success`, `failure`

## Emission Points
- QR create: success on QR + transaction creation, failure on exceptions.
- Webhook: success on PAID processing (including late webhook), failure on FAILED or non-applicable outcomes.
- Verify: success on PAID confirmation, failure on FAILED or non-PAID results.
- Timeout: success on EXPIRED updates, failure on worker errors.

## Latency
Emit `payments_latency_ms` histogram per flow, measuring from start of handler to completion (success/failure).

## Scope
- Emit metrics in service and worker paths; no schema changes.

## Testing
- No new tests required; optional spot checks via logs/metrics endpoint.
