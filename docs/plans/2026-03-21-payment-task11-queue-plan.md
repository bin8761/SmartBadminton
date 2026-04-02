# Payment Task 11.1 Queue Definition Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `payment` queue definition to the shared BullMQ queue module.

**Architecture:** Extend `backend/src/shared/queue.ts` with a `paymentQueue` using the same connection and naming conventions as the existing booking queue.

**Tech Stack:** Node.js, BullMQ

---

### Task 1: Add payment queue definition

**Files:**
- Modify: `backend/src/shared/queue.ts`

**Step 1: Write the failing test**

(No test; module wiring only.)

**Step 2: Run test to verify it fails**

(Skip; no test.)

**Step 3: Write minimal implementation**

```ts
export const paymentQueue = new Queue('payment', { connection });
```

Place it near `bookingQueue` and export it.

**Step 4: Run test to verify it passes**

(Skip.)

**Step 5: Commit**

```bash
git add src/shared/queue.ts
git commit -m "feat: add payment queue"
```
