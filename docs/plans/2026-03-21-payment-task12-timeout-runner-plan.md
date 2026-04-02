# Payment Task 12.2 Runner Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a dedicated runner to register the payment-timeout worker and expose a script to run it.

**Architecture:** Create `payment-timeout.runner.ts` that imports the worker module and logs startup. Add npm script `worker:payment-timeout` to run it via ts-node. Keep API bootstrap unchanged.

**Tech Stack:** Node.js, ts-node

---

### Task 1: Add payment-timeout runner

**Files:**
- Create: `backend/src/workers/payment-timeout.runner.ts`
- Modify: `backend/package.json`

**Step 1: Write the failing test**

(No test; runner wiring only.)

**Step 2: Run test to verify it fails**

(Skip.)

**Step 3: Write minimal implementation**

```ts
import './payment-timeout.worker';
// eslint-disable-next-line no-console
console.log('payment-timeout worker started');
```

In `backend/package.json` add:

```json
"worker:payment-timeout": "ts-node src/workers/payment-timeout.runner.ts"
```

**Step 4: Run test to verify it passes**

(Skip.)

**Step 5: Commit**

```bash
git add src/workers/payment-timeout.runner.ts package.json
git commit -m "feat: add payment timeout worker runner"
```
