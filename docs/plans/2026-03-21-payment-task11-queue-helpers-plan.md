# Payment Task 11.2 Queue Helpers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add helper functions for the payment queue to enqueue, find, and remove timeout jobs.

**Architecture:** Extend `backend/src/shared/queue.ts` with `enqueuePaymentTimeout`, `findPaymentJob`, and `removePaymentJob` using the existing `paymentQueue`. Job name is fixed to `payment-timeout` with `jobId = bookingId`.

**Tech Stack:** Node.js, BullMQ

---

### Task 1: Add payment queue helpers

**Files:**
- Modify: `backend/src/shared/queue.ts`

**Step 1: Write the failing test**

(No test; shared helpers only.)

**Step 2: Run test to verify it fails**

(Skip.)

**Step 3: Write minimal implementation**

```ts
const PAYMENT_TIMEOUT_JOB = 'payment-timeout';

export const enqueuePaymentTimeout = (
  bookingId: string,
  delayMs: number,
  options?: {
    attempts?: number;
    backoffDelayMs?: number;
    removeOnComplete?: boolean;
    removeOnFail?: number;
  },
) =>
  paymentQueue.add(
    PAYMENT_TIMEOUT_JOB,
    { bookingId },
    {
      delay: delayMs,
      jobId: bookingId,
      attempts: options?.attempts ?? 3,
      backoff: { type: 'exponential', delay: options?.backoffDelayMs ?? 5000 },
      removeOnComplete: options?.removeOnComplete ?? true,
      removeOnFail: options?.removeOnFail ?? 50,
    },
  );

export const findPaymentJob = (bookingId: string) =>
  paymentQueue.getJob(bookingId);

export const removePaymentJob = async (bookingId: string) => {
  const job = await paymentQueue.getJob(bookingId);
  if (job) {
    await job.remove();
    return true;
  }
  return false;
};
```

**Step 4: Run test to verify it passes**

(Skip.)

**Step 5: Commit**

```bash
git add src/shared/queue.ts
git commit -m "feat: add payment queue helpers"
```
