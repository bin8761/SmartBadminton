# Payment Schema Task 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `PaymentTransaction` model and payment enums to the Prisma schema for MOMO Phase 1.

**Architecture:** Extend `backend/prisma/schema.prisma` with `PaymentProvider` and `PaymentStatus` enums, and a new `PaymentTransaction` model related 1–n to `Booking` with one active `PENDING` attempt per booking enforced at service level.

**Tech Stack:** Prisma, PostgreSQL

---

### Task 1: Add payment enums and PaymentTransaction model

**Files:**
- Modify: `backend/prisma/schema.prisma`

**Step 1: Inspect current Prisma schema around Booking models**

Open the file and locate the `Booking` model and existing enums to ensure consistent placement.

**Step 2: Add enums**

Add the following enums (near other enums):

```prisma
enum PaymentProvider {
  MOMO
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  EXPIRED
}
```

**Step 3: Add PaymentTransaction model and relation**

Add the model below (place near `Booking`):

```prisma
model PaymentTransaction {
  id                String         @id @default(uuid())
  bookingId         String
  booking           Booking        @relation(fields: [bookingId], references: [id])
  provider          PaymentProvider
  status            PaymentStatus  @default(PENDING)
  amount            Int
  currency          String
  externalOrderId   String
  externalRequestId String?
  payUrl            String?
  meta              Json?
  paidAt            DateTime?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  @@unique([provider, externalOrderId])
  @@index([status, createdAt])
  @@index([bookingId, status])
}
```

Update `Booking` to add a 1–n relation field:

```prisma
model Booking {
  // ...existing fields
  paymentTransactions PaymentTransaction[]
}
```

**Step 4: Quick schema sanity check**

Ask the user to run:

```bash
npx prisma validate --schema backend/prisma/schema.prisma
```

Expected: `The schema at ... is valid`

**Step 5: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat: add payment transaction schema"
```
