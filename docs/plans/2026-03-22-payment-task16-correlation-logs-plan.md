# Payment Task 16.1 Correlation Logs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add structured correlation IDs (`bookingId`, `paymentTransactionId`) to payment logs in service and controller.

**Architecture:** Keep existing logger usage; enrich log payloads with correlation fields where context is available. No behavioral changes.

**Tech Stack:** Node.js, TypeScript, Express, Prisma, shared logger

---

### Task 1: Audit Existing Payment Logs

**Files:**
- Modify: `backend/src/modules/payments/services/payment.service.ts`
- Modify: `backend/src/modules/payments/controllers/payment.controller.ts`

**Step 1: Review current log payloads**
- Identify which logs already include `bookingId`/`paymentTransactionId`.
- Mark the log lines missing these fields.

**Step 2: Document target logs for updates**
- Service: ensure `payment_qr_created`, `payment_timeout_enqueued`, `enqueue payment timeout failed`, `payment_late_webhook_refund_required` include both fields (add only if missing).
- Controller: add correlation fields to `create payment qr failed`, `payment webhook failed`, `verify payment failed`.

**Step 3: Commit**
- No code changes yet; skip commit.

### Task 2: Add Correlation Fields In Payment Service Logs

**Files:**
- Modify: `backend/src/modules/payments/services/payment.service.ts`

**Step 1: Add missing fields to log payloads**
- For each service log, add `bookingId` and `paymentTransactionId` if available in scope.
- Preserve existing fields and messages.

**Step 2: Run lint/typecheck (if available)**
Run: `npm run lint` (if configured)
Expected: PASS

**Step 3: Commit**
```bash
git add backend/src/modules/payments/services/payment.service.ts
git commit -m "chore(payments): add correlation ids to service logs"
```

### Task 3: Add Correlation Fields In Payment Controller Logs

**Files:**
- Modify: `backend/src/modules/payments/controllers/payment.controller.ts`

**Step 1: Add correlation fields to error logs**
- `createPaymentQrHandler`: add `bookingId` from `req.params` if parsed, and `paymentTransactionId` if available (likely undefined here).
- `handleSepayWebhook`: include `bookingId` if it can be derived from payload; otherwise log only `paymentTransactionId` if later available (likely undefined).
- `verifyPaymentHandler`: add `bookingId` from `req.body`, `paymentTransactionId` from result/latest.

**Step 2: Run targeted tests (if any)**
- If payment controller tests assert log payloads, update expectations.

**Step 3: Commit**
```bash
git add backend/src/modules/payments/controllers/payment.controller.ts
git commit -m "chore(payments): add correlation ids to controller logs"
```

### Task 4: Update Task Checklist

**Files:**
- Modify: `task/payment-task-breakdown.md`

**Step 1: Mark Task 16.1 complete**
- Check the task box for Task 16.1.

**Step 2: Commit**
```bash
git add task/payment-task-breakdown.md
git commit -m "docs(tasks): complete payment task 16.1"
```

---

## Notes
- If `paymentTransactionId` is not available at a log point, log `undefined` or omit it (prefer including as `undefined` to keep schema consistent).
- Do not log request bodies or sensitive payloads.
