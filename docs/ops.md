# Operations & Security Notes

## HTTPS / Production Deployment
- All API traffic must be terminated over HTTPS. Configure your reverse proxy (NGINX/Traefik) to enforce TLS 1.2+ and forward X-Forwarded-Proto so Express can detect secure requests.
- When running behind a proxy, set pp.set('trust proxy', true) in the Express bootstrap so 
eq.ip and rate limiting work correctly.
- Certificates should be stored in your secret manager or injected via the deployment platform. Do **not** commit them to the repo.

## Logging / PII Masking
- Pino logger is configured to log structured events only. Avoid logging raw request bodies or secrets.
- When logging identifiers, prefer masked values (e.g., last 4 digits of phone). The current registration flow only logs username, userId, and high-level error codes.
- Audit entries (login_audit table) already store IP/User-Agent; avoid storing plaintext passwords or tokens.
- Available courts search logs criteria (date, startTime, endTime) and result count; avoid logging user PII in these events.

## Metrics
- auth_registration_success_total / auth_registration_failure_total / auth_registration_duration_ms
- auth_login_success_total / auth_login_failure_total / auth_login_duration_ms
- courts_available_search_total / courts_available_empty_total / courts_available_duration_ms
- bookings_created_total / bookings_create_latency_ms / bookings_expired_total
- bookings_canceled_total{result,refund_policy} / bookings_cancel_latency_ms / refund_manual_pending_total

## Redis / BullMQ (Booking Expire Worker)
- Requires `REDIS_URL` to be configured in `.env`.
- Worker can run as a separate process: `npm run worker:booking-expire`.
- App will load the worker only when `BOOKING_EXPIRE_WORKER=true`.
- Jobs use delayed scheduling with exponential retry/backoff (see `backend/src/modules/bookings/services/create-booking.service.ts`).
- If running multiple worker instances, ensure Redis is reachable and monitor queue health.

## Cancel Booking (Phase 1 Manual Refund)
- Cancel booking API persists booking cancellation and refund transaction atomically in a single DB transaction.
- Phase 1 does not call external payment gateway APIs; refund handling is internal/manual.
- Refund policy uses configured environment settings:
  - `BOOKING_CANCEL_REFUND_RATE` (default `0.7`)
  - `BOOKING_CANCEL_MIN_HOURS_FOR_REFUND` (default `24`)
  - `BOOKING_CANCEL_TIMEZONE` (default `Asia/Ho_Chi_Minh`)
- For cancellation `<24h` before booking start, API still returns success with:
  - `refundPolicy=NO_REFUND`
  - `refundAmount=0`
  - terminal manual status (`COMPLETED_MANUAL`)
- For refund-required cases, manual processing starts at `PENDING_MANUAL`; operations team must review and complete/refuse manually.
- Structured events to monitor cancel flow:
  - `booking_cancel_requested`
  - `booking_cancel_rejected`
  - `booking_canceled`
  - `booking_audit_event` with `BOOKING_CANCEL_ATTEMPT` / `BOOKING_CANCELED`

## Payments (SePay Webhook + Timeout Worker)
- Webhook auth uses header `Authorization: Apikey <SEPAY_IPN_API_KEY>`.
- Successful webhook response returns `200` with empty body; invalid signature returns `401` with empty body.
- Monitor webhook events:
  - `payment.webhook.received`
  - `payment.webhook.processed`
- Payment-timeout worker runs as a separate process:
  - Command: `npm run worker:payment-timeout`
  - Requires `REDIS_URL` to be configured and reachable.
  - Job name: `payment-timeout`
  - On timeout: PaymentTransaction `PENDING -> EXPIRED`, Booking `PENDING_PAYMENT -> EXPIRED`.
- Monitor timeout logs:
  - `payment_timeout_started`
  - `payment_timeout_skipped`
  - `payment_timeout_completed`
  - `payment timeout worker failed`
- Quick checks:
  - Webhook `401`: verify `SEPAY_IPN_API_KEY` and header format.
  - Timeout not processing: confirm worker is running and Redis connectivity.

## Refresh Token Storage
- Refresh tokens are hashed with bcrypt before being stored; never persist plaintext tokens.
- Rotate RSA keys periodically and update .env secrets accordingly.

Keep this document updated as new operational requirements are introduced.
