# Payment Validators Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Zod validators for payment QR creation and verify endpoints.

**Architecture:** Add validators under `backend/src/modules/payments/validators` and export them for controllers.

**Tech Stack:** Zod, TypeScript

---

### Task 1: Create validators

**Files:**
- Create: `backend/src/modules/payments/validators/payment.validator.ts`

**Step 1: Add validators**

```ts
import { z } from 'zod';

export const createPaymentQrValidator = z.object({
  params: z.object({
    bookingId: z.string().uuid(),
  }),
});

export const verifyPaymentValidator = z.object({
  body: z.object({
    bookingId: z.string().uuid(),
  }),
});
```

**Step 2: Export barrel**

Create `backend/src/modules/payments/validators/index.ts` with:

```ts
export * from './payment.validator';
```

**Step 3: Commit**

```bash
git add backend/src/modules/payments/validators/payment.validator.ts backend/src/modules/payments/validators/index.ts
git commit -m "feat: add payment validators"
```
