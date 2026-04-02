## Environment Variables

Create a `.env` file in `backend/` (copy from `.env.example` when available) and provide the following values:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string for Prisma. |
| `PORT` | No (default `3000`) | Port the backend server listens on. |
| `NODE_ENV` | No (default `development`) | Runtime environment. |
| `LOG_LEVEL` | No (default `info`) | Pino/Winston log level. |
| `JWT_ACCESS_PRIVATE_KEY` | Yes | Base64/PEM private key for RS256 access tokens. |
| `JWT_ACCESS_PUBLIC_KEY` | Yes | Public key for verifying access tokens. |
| `JWT_REFRESH_PRIVATE_KEY` | Yes | Private key for RS256 refresh tokens. |
| `JWT_REFRESH_PUBLIC_KEY` | Yes | Public key for refresh token verification. |
| `ACCESS_TOKEN_TTL` | No (default `15m`) | Access token lifetime (ms, s, m). |
| `REFRESH_TOKEN_TTL` | No (default `30d`) | Refresh token lifetime. |
| `BCRYPT_SALT_ROUNDS` | No (default `12`) | Bcrypt cost factor for password hashing. |
| `RATE_LIMIT_WINDOW_MS` | No (default `900000`) | Window length for rate limiter in milliseconds. |
| `RATE_LIMIT_MAX` | No (default `5`) | Max requests per window per IP for registration endpoint. |
| `RATE_LIMIT_STORE` | No (`memory`/`redis`) | Choose `redis` in production to share counters. |
| `REDIS_URL` | Yes | Redis connection string for BullMQ queues. |
| `BOOKING_EXPIRE_MINUTES` | No (default `15`) | Minutes before a pending booking expires. |
| `BOOKING_CANCEL_REFUND_RATE` | No (default `0.7`) | Refund ratio applied when cancellation is at least threshold hours before booking start. |
| `BOOKING_CANCEL_MIN_HOURS_FOR_REFUND` | No (default `24`) | Exact hour threshold for refund eligibility in cancel-booking flow. |
| `BOOKING_CANCEL_TIMEZONE` | No (default `Asia/Ho_Chi_Minh`) | Timezone used to evaluate cancellation/refund threshold. |
| `PAYMENT_TIMEOUT_MINUTES` | No (default `10`) | Minutes before a pending payment attempt expires. |
| `SEPAY_MERCHANT_ID` | No | SePay merchant identifier. |
| `SEPAY_SECRET_KEY` | No | SePay secret key for signing or verification (provider-specific). |
| `SEPAY_API_BASE_URL` | No | SePay API base URL for verify requests. |
| `SEPAY_API_TOKEN` | No | SePay API token for verify requests. |
| `SEPAY_WEBHOOK_SECRET` | No | SePay webhook secret (if provided by SePay). |
| `SEPAY_IPN_API_KEY` | No | SePay IPN API key used in webhook Authorization header. |
| `SEPAY_BANK_ACCOUNT` | No | Bank account used to generate QR. |
| `SEPAY_BANK_NAME` | No | Bank name used to generate QR. |
| `SEPAY_QR_EXPIRE_MINUTES` | No (default `10`) | QR validity window in minutes. |

> **Note:** Do not commit `.env` files. An `.env.example` template should contain non-secret placeholders.

Ensure `.env`, `*.pem`, and other secret files are listed in `.gitignore`. Current root `.gitignore` already ignores `.env`. If additional secret paths are introduced (e.g., `backend/keys/`), add them here before committing.
