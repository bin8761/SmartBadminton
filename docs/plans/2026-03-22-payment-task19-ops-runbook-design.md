# Payment Task 19.2 Design - Ops Runbook

Date: 2026-03-22

## Summary
Update `docs/ops.md` with concrete operational runbook details for SePay webhook handling and payment-timeout worker.

## Scope
- Add webhook handling notes (auth header, responses, logs).
- Add timeout worker runbook (command, Redis requirement, job behavior, logs).
- Add quick troubleshooting tips.

## Content
- Webhook auth: `Authorization: Apikey <SEPAY_IPN_API_KEY>`
- Responses: `200` empty, `401` empty
- Worker run command: `npm run worker:payment-timeout`
- Redis dependency: `REDIS_URL`
- Job name: `payment-timeout`
- Status updates on timeout
- Logs to watch

## Non-Goals
- No runtime changes

## Testing
- No tests required for documentation-only change
