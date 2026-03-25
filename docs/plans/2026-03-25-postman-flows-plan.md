# Postman Flows (3 Flows) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Tạo 3 Postman Flows riêng biệt (đặt sân+thanh toán, đặt sân+hủy, kiểm tra sân trống) dùng Collection Variables và thời gian động GMT+7.

**Architecture:** Mỗi flow là 1 file exportable, gồm các request nodes, scripts tính thời gian động, và guard khi danh sách sân trống.

**Tech Stack:** Postman Flows, Postman scripting (pm.*).

---

### Task 1: Chuẩn hóa Collection Variables

**Files:**
- Modify: Postman Collection Variables (manual)

**Step 1: Ensure variables exist**
- `baseUrl`
- `username`
- `password`

**Step 2: Verify**
- Đảm bảo các request dùng `{{baseUrl}}` và auth dùng `{{accessToken}}` (từ scripts trước đó).

---

### Task 2: Tạo Flow A (Đặt sân + thanh toán)

**Files:**
- Create: `docs/postman/flows/flow-booking-payment.json`

**Step 1: Nodes**
- Login request
- Script node: tạo `date`, `startTime`, `endTime` (GMT+7)
- Get available courts
- Script node: pick `courtId` (first item) + guard empty list
- Create booking
- Create payment QR
- Verify payment

**Step 2: Dynamic time script (GMT+7)**
- `date` = today (YYYY-MM-DD)
- `startTime` = now + 2h (HH:mm)
- `endTime` = now + 3h (HH:mm)

**Step 3: Export**
- Export flow to `docs/postman/flows/flow-booking-payment.json`

---

### Task 3: Tạo Flow B (Đặt sân + hủy)

**Files:**
- Create: `docs/postman/flows/flow-booking-cancel.json`

**Step 1: Nodes**
- Login request
- Script node: tạo `date`, `startTime`, `endTime`
- Get available courts
- Script node: pick `courtId` + guard empty list
- Create booking
- Cancel booking (reason mặc định)

**Step 2: Export**
- Export flow to `docs/postman/flows/flow-booking-cancel.json`

---

### Task 4: Tạo Flow C (Kiểm tra sân trống)

**Files:**
- Create: `docs/postman/flows/flow-check-availability.json`

**Step 1: Nodes**
- Login request
- Script node: tạo `date`, `startTime`, `endTime`
- Get available courts
- Script node: log list + set `courtId` nếu có

**Step 2: Export**
- Export flow to `docs/postman/flows/flow-check-availability.json`

---

### Task 5: Tạo README hướng dẫn import

**Files:**
- Create: `docs/postman/flows/README.md`

**Step 1: Include**
- Hướng dẫn import từng flow file
- Biến cần set trước khi chạy
- Thứ tự chạy

---

Plan complete and saved to `docs/plans/2026-03-25-postman-flows-plan.md`. Two execution options:

1. Subagent-Driven (this session) - I dispatch fresh subagent per task, review between tasks, fast iteration
2. Parallel Session (separate) - Open new session with executing-plans, batch execution with checkpoints

Which approach?
