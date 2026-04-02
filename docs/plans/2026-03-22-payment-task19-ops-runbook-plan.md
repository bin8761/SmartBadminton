# Payment Task 19.2 Ops Runbook Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add SePay webhook and payment-timeout worker operational notes to `docs/ops.md`.

**Architecture:** Extend Ops doc with a Payments section covering webhook auth, responses, worker command, dependencies, and troubleshooting.

**Tech Stack:** Markdown documentation

---

### Task 1: Update Ops Doc

**Files:**
- Modify: `docs/ops.md`

**Step 1: Add Payments section**
- Webhook handling details
- Timeout worker runbook
- Quick troubleshooting

**Step 2: Commit**
```bash
git add docs/ops.md
git commit -m "docs(ops): add payment webhook and timeout worker runbook"
```

### Task 2: Update Task Checklist

**Files:**
- Modify: `task/payment-task-breakdown.md`

**Step 1: Mark Task 19.2 complete**

**Step 2: Commit**
```bash
git add task/payment-task-breakdown.md
git commit -m "docs(tasks): complete payment task 19.2"
```

---

## Notes
- Keep consistency with existing ops format.
