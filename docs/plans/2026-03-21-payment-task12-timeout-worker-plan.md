# Payment Task 12.1 Worker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `payment-timeout` worker to expire pending payment attempts and set bookings to `EXPIRED` when timeouts occur.

**Architecture:** Create a BullMQ worker that listens to the `payment` queue, processes the `payment-timeout` job, and updates `PaymentTransaction` and `Booking` statuses in a single DB transaction. Use existing logger and Prisma client.

**Tech Stack:** Node.js, BullMQ, Prisma

---

### Task 1: Add payment-timeout worker file

**Files:**
- Create: `backend/src/workers/payment-timeout.worker.ts`

**Step 1: Write the failing test**

(No test; worker wiring only.)

**Step 2: Run test to verify it fails**

(Skip.)

**Step 3: Write minimal implementation**

```ts
import { Worker } from 'bullmq';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import logger from '../shared/logger';
import prisma from '../shared/prisma';
import { paymentQueue } from '../shared/queue';

const worker = new Worker(
  paymentQueue.name,
  async (job) => {
    if (job.name !== 'payment-timeout') {
      return;
    }

    const bookingId = job.data?.bookingId as string | undefined;
    if (!bookingId) {
      logger.warn({ jobId: job.id }, 'payment timeout job missing bookingId');
      return;
    }

    logger.info({ bookingId, jobId: job.id }, 'payment_timeout_started');

    await prisma.$transaction(async (tx) => {
      const latest = await tx.paymentTransaction.findFirst({
        where: { bookingId },
        orderBy: { createdAt: 'desc' },
      });

      if (!latest || latest.status !== PaymentStatus.PENDING) {
        logger.info({ bookingId, jobId: job.id }, 'payment_timeout_skipped');
        return;
      }

      await tx.paymentTransaction.update({
        where: { id: latest.id },
        data: { status: PaymentStatus.EXPIRED },
      });

      await tx.booking.updateMany({
        where: { id: bookingId, status: BookingStatus.PENDING_PAYMENT },
        data: { status: BookingStatus.EXPIRED },
      });
    });

    logger.info({ bookingId, jobId: job.id }, 'payment_timeout_completed');
  },
  { connection: paymentQueue.opts.connection },
);

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'payment timeout worker failed');
});
```

**Step 4: Run test to verify it passes**

(Skip.)

**Step 5: Commit**

```bash
git add src/workers/payment-timeout.worker.ts
git commit -m "feat: add payment-timeout worker"
```
