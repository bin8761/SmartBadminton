# SePay QR Adapter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement SePay QR provider adapter for QR URL generation, IPN signature validation, webhook handling, and verify via BankHub API.

**Architecture:** Create `sepay.provider.ts` implementing `PaymentProvider` and reading config from `env.ts` payment/sepay settings. Use SePay QR image URL for `createQr`, validate IPN `Authorization: Apikey ...`, parse payload with `payment_code` fallback to `content`, and implement verify via BankHub transaction API.

**Tech Stack:** TypeScript, Node.js, fetch/axios (use existing project HTTP utility if present; otherwise `fetch`).

---

### Task 1: Add SePay provider implementation

**Files:**
- Create: `backend/src/modules/payments/providers/sepay.provider.ts`

**Step 1: Implement helper utilities**

- Build QR URL:

```ts
const buildQrUrl = (account: string, bank: string, amount: number, description: string) =>
  `https://qr.sepay.vn/img?acc=${encodeURIComponent(account)}&bank=${encodeURIComponent(bank)}&amount=${amount}&des=${encodeURIComponent(description)}`;
```

- Parse bookingId:

```ts
const parseBookingId = (paymentCode?: string | null, content?: string | null) => {
  if (paymentCode) return paymentCode;
  if (!content) return undefined;
  const match = content.match(/SB_([0-9a-fA-F-]{36})/);
  return match?.[1];
};
```

**Step 2: Implement provider class**

- `createQr`: build QR URL, return `externalOrderId` = bookingId, `qrString`, raw payload.
- `validateSignature`: check `Authorization` header equals `Apikey ${SEPAY_IPN_API_KEY}`.
- `handleWebhook`: parse payload, resolve bookingId, map to `PaymentVerifyResult`.
- `verify`: call `GET /v1/transaction` with filters (if `transaction_id` known) or `GET /v1/transaction/{transaction_id}`; return mapped status.

**Step 3: Commit**

```bash
git add backend/src/modules/payments/providers/sepay.provider.ts
git commit -m "feat: add sepay payment provider adapter"
```

### Task 2: Update env example with base URL notes

**Files:**
- Modify: `backend/.env.example`

**Step 1: Add comment for production vs sandbox**

Example:
```
# SEPAY_API_BASE_URL
# Sandbox: https://bankhub-api-sandbox.sepay.vn
# Production: https://bankhub-api.sepay.vn
```

**Step 2: Commit**

```bash
git add backend/.env.example
git commit -m "docs: clarify sepay base url environments"
```
