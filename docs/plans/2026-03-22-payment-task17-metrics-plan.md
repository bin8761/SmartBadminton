# Payment Task 17.1 Metrics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Define payment metrics for success, failure, and latency in shared metrics registry.

**Architecture:** Add metric definitions to the central metrics module with consistent naming and label schema; do not emit in this task.

**Tech Stack:** Node.js, TypeScript, Prometheus client (existing shared metrics)

---

### Task 1: Add Payment Metrics Definitions

**Files:**
- Modify: `backend/src/shared/metrics.ts`

**Step 1: Add counters for success/failure**
- Define `payments_success_total` and `payments_failure_total` with labels `provider` and `result`.

**Step 2: Add latency histogram**
- Define `payments_latency_ms` with labels `provider` and optional `flow`.

**Step 3: Export metrics**
- Ensure new metrics are exported following existing pattern.

**Step 4: Commit**
```bash
git add backend/src/shared/metrics.ts
git commit -m "chore(metrics): add payment success/failure/latency metrics"
```

### Task 2: Update Task Checklist

**Files:**
- Modify: `task/payment-task-breakdown.md`

**Step 1: Mark Task 17.1 complete**

**Step 2: Commit**
```bash
git add task/payment-task-breakdown.md
git commit -m "docs(tasks): complete payment task 17.1"
```

---

## Notes
- Keep naming consistent with existing metrics.
- Use ms for latency histogram buckets if existing convention uses milliseconds.
