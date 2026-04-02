# Payment Service Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement payment service for QR creation, webhook handling, verify, and idempotency.

**Architecture:** Add a service module that uses booking repository, payment repository, and SePay provider to orchestrate payment flow rules.

**Tech Stack:** TypeScript, Prisma

---

### Task 1: Create payment service module

**Files:**
- Create: `backend/src/modules/payments/services/payment.service.ts`

**Step 1: Implement createQr flow**

Pseudo-steps:
- Load booking and validate `PENDING_PAYMENT` + ownership.
- Check existing PENDING attempt:
  - if booking unchanged → return existing QR.
  - if booking changed (price/time/court) → mark old attempt `FAILED`, continue.
- Call provider `createQr`.
- Persist `PaymentTransaction`.

**Step 2: Implement handleWebhook flow**
- Validate signature outside service (controller), then call service with parsed payload.
- Resolve bookingId via payment_code/content.
- Idempotent update by `externalOrderId`.
- Update booking to `PAID` if payment success.

**Step 3: Implement verify flow**
- Call provider `verify` using `externalOrderId`.
- Idempotent update.

**Step 4: Commit**

```bash
git add backend/src/modules/payments/services/payment.service.ts
git commit -m "feat: add payment service"
```
