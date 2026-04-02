# Fix Zod v4 Payment Validation Middleware Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix TS18046 by typing the payment validation middleware's Zod schema.

**Architecture:** Use a typed Zod schema (`ZodType<PaymentRequestShape>`) to make `parse()` return a typed object.

**Tech Stack:** TypeScript, Zod v4

---

### Task 1: Update Middleware Typing

**Files:**
- Modify: `backend/src/modules/payments/middleware/validate-payment-request.ts`

**Step 1: Add `PaymentRequestShape` type**
- `{ params?: Record<string, unknown>; body?: unknown }`

**Step 2: Change schema type**
- `ZodSchema` ? `ZodType<PaymentRequestShape>`

**Step 3: Commit**
```bash
git add backend/src/modules/payments/middleware/validate-payment-request.ts
git commit -m "fix(payments): type payment request validator for zod v4"
```

---

## Notes
- Keep runtime behavior unchanged.
