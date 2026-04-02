# Payment Task 13.1 Enqueue Timeout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enqueue a `payment-timeout` job when a payment QR is created.

**Architecture:** Update `createPaymentQrService` to call `enqueuePaymentTimeout` after creating a `PaymentTransaction`. Use `config.payment.timeoutMinutes` to set delay and log enqueue results.

**Tech Stack:** Node.js, BullMQ, Prisma

---

### Task 1: Enqueue payment-timeout after QR creation

**Files:**
- Modify: `backend/src/modules/payments/services/payment.service.ts`

**Step 1: Write the failing test**

(No test; payment service already lacks test infra.)

**Step 2: Run test to verify it fails**

(Skip.)

**Step 3: Write minimal implementation**

```ts
import { enqueuePaymentTimeout } from '../../../shared/queue';

// after createPaymentTransaction
const delayMs = config.payment.timeoutMinutes * 60 * 1000;
try {
  await enqueuePaymentTimeout(payment.id, delayMs);
  logger.info({
    bookingId: booking.id,
    paymentTransactionId: payment.id,
    delayMs,
  }, 'payment_timeout_enqueued');
} catch (error) {
  logger.warn({
    err: error,
    bookingId: booking.id,
    paymentTransactionId: payment.id,
  }, 'enqueue payment timeout failed');
}
```

**Step 4: Run test to verify it passes**

(Skip.)

**Step 5: Commit**

```bash
git add src/modules/payments/services/payment.service.ts
git commit -m "feat: enqueue payment timeout on QR creation"
```
