# Payment Task 18.2 OpenAPI Verify Endpoint Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add OpenAPI documentation for `POST /api/payments/verify` in the payments spec.

**Architecture:** Extend `docs/api/payments.yaml` with a new verify path, using the shared ErrorResponse schema and Bearer auth.

**Tech Stack:** OpenAPI 3.0.3 (YAML)

---

### Task 1: Add Verify Endpoint To Payments OpenAPI

**Files:**
- Modify: `docs/api/payments.yaml`

**Step 1: Add path and request body**
- Path: `/api/payments/verify`
- Method: `post`
- Auth: `bearerAuth`
- Body: `bookingId` (uuid)

**Step 2: Add success response**
- `200` with `paymentTransactionId`, `paymentStatus`, `paidAt`, `provider`, `amount`, `currency`

**Step 3: Add error responses**
- `400`, `401`, `403`, `404` (USER_NOT_FOUND, BOOKING_NOT_FOUND, PAYMENT_NOT_FOUND), `500`

**Step 4: Commit**
```bash
git add docs/api/payments.yaml
git commit -m "docs(api): add payments verify endpoint"
```

### Task 2: Update Task Checklist

**Files:**
- Modify: `task/payment-task-breakdown.md`

**Step 1: Mark Task 18.2 complete**

**Step 2: Commit**
```bash
git add task/payment-task-breakdown.md
git commit -m "docs(tasks): complete payment task 18.2"
```

---

## Notes
- Keep response schema consistent with controller output.
