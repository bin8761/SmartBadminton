# Payment Task 16.2 Structured Logs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add structured log events for payment QR creation, webhook handling, verification, and success/failure outcomes.

**Architecture:** Introduce consistent event names (`payment.<stage>.<outcome>`) with structured payload fields in payment service/controller logs. Keep existing logic unchanged.

**Tech Stack:** Node.js, TypeScript, Express, Prisma, shared logger

---

### Task 1: Inventory Current Payment Log Points

**Files:**
- Modify: `backend/src/modules/payments/services/payment.service.ts`
- Modify: `backend/src/modules/payments/controllers/payment.controller.ts`

**Step 1: Identify existing logs**
- List current logs for QR creation, webhook handling, verify flow, and error paths.

**Step 2: Map to new event names**
- Decide which new events to add and where.

**Step 3: Commit**
- No code changes; skip commit.

### Task 2: Add Structured Logs In Payment Service

**Files:**
- Modify: `backend/src/modules/payments/services/payment.service.ts`

**Step 1: Add requested/processed events**
- Add `payment.qr.create.requested` before QR creation call.
- Add `payment.qr.create.succeeded` after QR + transaction creation.
- Add `payment.qr.create.failed` in catch/exception path.
- Add `payment.webhook.received` at webhook handling entry.
- Add `payment.webhook.processed` after processing result.
- Add `payment.verify.requested` at verify start.
- Add `payment.verify.succeeded` when verified PAID.
- Add `payment.verify.failed` when failed or not paid.

**Step 2: Ensure payload includes fields**
- `bookingId`, `paymentTransactionId`, `provider`
- Optional: `paymentStatus`, `amount`, `currency`, `paidAt`, `reason`

**Step 3: Run lint/typecheck (if available)**
Run: `npm run lint`
Expected: PASS

**Step 4: Commit**
```bash
git add backend/src/modules/payments/services/payment.service.ts
git commit -m "chore(payments): add structured payment service logs"
```

### Task 3: Add Structured Logs In Payment Controller (Optional Entry Logs)

**Files:**
- Modify: `backend/src/modules/payments/controllers/payment.controller.ts`

**Step 1: Add received logs at entry points**
- `payment.qr.create.requested` for create QR handler.
- `payment.webhook.received` for webhook handler.
- `payment.verify.requested` for verify handler.

**Step 2: Ensure payload includes fields**
- `bookingId` where available, `paymentTransactionId` if available

**Step 3: Commit**
```bash
git add backend/src/modules/payments/controllers/payment.controller.ts
git commit -m "chore(payments): add structured payment controller logs"
```

### Task 4: Update Task Checklist

**Files:**
- Modify: `task/payment-task-breakdown.md`

**Step 1: Mark Task 16.2 complete**

**Step 2: Commit**
```bash
git add task/payment-task-breakdown.md
git commit -m "docs(tasks): complete payment task 16.2"
```

---

## Notes
- Avoid logging sensitive payloads.
- Keep event names consistent across layers.
- If no explicit failure catch exists, add logs at existing error handling points only.
