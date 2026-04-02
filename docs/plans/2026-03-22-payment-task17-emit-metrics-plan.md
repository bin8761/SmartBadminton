# Payment Task 17.2 Emit Metrics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Emit payment success/failure counters and latency histograms for QR create, webhook, verify, and timeout flows.

**Architecture:** Use shared metrics counters/histograms with `provider`, `result`, and `flow` labels. Measure latency per flow and emit on success/failure paths. No behavior changes.

**Tech Stack:** Node.js, TypeScript, Prometheus client (shared metrics)

---

### Task 1: Emit Metrics In Payment Service (QR/Webhook/Verify)

**Files:**
- Modify: `backend/src/modules/payments/services/payment.service.ts`

**Step 1: Add latency timers**
- Capture `start = Date.now()` at entry of `createPaymentQrService`, `handlePaymentWebhookService`, `verifyPaymentService`.

**Step 2: Emit counters and latency**
- On success: increment `payments_success_total` with labels `{ provider, result: 'success' }` and observe `payments_latency_ms` with `{ provider, flow }`.
- On failure: increment `payments_failure_total` with labels `{ provider, result: 'failure' }` and observe latency in finally/ catch.

**Step 3: Map flow labels**
- `qr_create`, `webhook`, `verify`

**Step 4: Commit**
```bash
git add backend/src/modules/payments/services/payment.service.ts
git commit -m "chore(metrics): emit payment metrics in service"
```

### Task 2: Emit Metrics In Payment Timeout Worker

**Files:**
- Modify: `backend/src/workers/payment-timeout.worker.ts`

**Step 1: Add counters and latency**
- Wrap handler with start time, emit success/failure for `flow=timeout`.

**Step 2: Commit**
```bash
git add backend/src/workers/payment-timeout.worker.ts
git commit -m "chore(metrics): emit payment timeout metrics"
```

### Task 3: Update Task Checklist

**Files:**
- Modify: `task/payment-task-breakdown.md`

**Step 1: Mark Task 17.2 complete**

**Step 2: Commit**
```bash
git add task/payment-task-breakdown.md
git commit -m "docs(tasks): complete payment task 17.2"
```

---

## Notes
- Use `SEPAY` as provider label.
- Observe latency in milliseconds.
- Avoid double-counting if early returns exist.
