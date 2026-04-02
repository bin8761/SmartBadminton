# Fix Express Params Type Mismatch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix TS2322 by aligning payment validation middleware params type with Express.

**Architecture:** Use `ParamsDictionary` for parsed params.

**Tech Stack:** TypeScript, Express

---

### Task 1: Update Params Type

**Files:**
- Modify: `backend/src/modules/payments/middleware/validate-payment-request.ts`

**Step 1: Import ParamsDictionary**
- `import type { ParamsDictionary } from "express-serve-static-core";`

**Step 2: Update PaymentRequestShape.params**
- `params?: ParamsDictionary`

**Step 3: Commit**
```bash
git add backend/src/modules/payments/middleware/validate-payment-request.ts
git commit -m "fix(payments): align params type with express"
```

---

## Notes
- Keeps runtime logic unchanged.
