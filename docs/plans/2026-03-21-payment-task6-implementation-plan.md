# Payment Repository Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add payment repository for `PaymentTransaction` CRUD with minimal methods to support QR flow, webhook idempotency, and verify.

**Architecture:** Repository functions wrap Prisma client calls and return `PaymentTransaction` records. Methods include create, find latest, find pending, update status, and find by external order id.

**Tech Stack:** Prisma, TypeScript

---

### Task 1: Create payment repository

**Files:**
- Create: `backend/src/modules/payments/repositories/payment.repository.ts`

**Step 1: Add repository methods**

```ts
import { PrismaClient, PaymentStatus, PaymentProvider } from '@prisma/client';

const prisma = new PrismaClient();

export const createPaymentTransaction = (data: {
  bookingId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  currency: string;
  externalOrderId: string;
  externalRequestId?: string | null;
  payUrl?: string | null;
  qrString?: string | null;
  meta?: object | null;
}) =>
  prisma.paymentTransaction.create({
    data: {
      ...data,
      externalRequestId: data.externalRequestId ?? null,
      payUrl: data.payUrl ?? null,
      qrString: data.qrString ?? null,
      meta: data.meta ?? undefined,
    },
  });

export const findLatestByBookingId = (bookingId: string) =>
  prisma.paymentTransaction.findFirst({
    where: { bookingId },
    orderBy: { createdAt: 'desc' },
  });

export const findPendingByBookingId = (bookingId: string) =>
  prisma.paymentTransaction.findFirst({
    where: { bookingId, status: PaymentStatus.PENDING },
    orderBy: { createdAt: 'desc' },
  });

export const updateStatusById = (
  id: string,
  status: PaymentStatus,
  paidAt?: Date | null,
) =>
  prisma.paymentTransaction.update({
    where: { id },
    data: {
      status,
      paidAt: paidAt ?? undefined,
    },
  });

export const findByExternalOrderId = (
  provider: PaymentProvider,
  externalOrderId: string,
) =>
  prisma.paymentTransaction.findUnique({
    where: { provider_externalOrderId: { provider, externalOrderId } },
  });
```

**Step 2: Commit**

```bash
git add backend/src/modules/payments/repositories/payment.repository.ts
git commit -m "feat: add payment repository"
```
