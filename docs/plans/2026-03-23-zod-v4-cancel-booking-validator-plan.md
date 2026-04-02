# Fix Zod v4 Cancel Booking Validator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make cancel-booking validator compatible with Zod v4 while keeping validation messages unchanged.

**Architecture:** Replace `required_error`/`invalid_type_error` options with preprocess + superRefine logic.

**Tech Stack:** TypeScript, Zod v4

---

### Task 1: Update Cancel Booking Validator

**Files:**
- Modify: `backend/src/modules/bookings/validators/cancel-booking.validator.ts`

**Step 1: Replace Zod string options**
- Remove `required_error`/`invalid_type_error` usage.
- Add `z.preprocess` + `superRefine` to preserve messages.

**Step 2: Commit**
```bash
git add backend/src/modules/bookings/validators/cancel-booking.validator.ts
git commit -m "fix(validators): align cancel booking validator with zod v4"
```

---

## Notes
- Keep message strings identical to current behavior.
- No tests added.
