# Postman Response Variables Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Thêm Post-response scripts per-request để trích các field từ response và lưu vào Collection Variables trong Postman.

**Architecture:** Mỗi request quan trọng có script riêng, chỉ parse JSON cho 2xx, set biến nếu field tồn tại. Không dùng collection-level script để giảm rủi ro lỗi.

**Tech Stack:** Postman scripting (pm.*), OpenAPI-backed requests.

---

### Task 1: Add Post-response script for Auth (login/register)

**Files:**
- Modify: `docs/postman/scripts/auth.post.js` (create)
- Modify: Collection request: `POST /api/auth/login` (Post-response script)
- Modify: Collection request: `POST /api/auth/register` (Post-response script)

**Step 1: Create auth script snippet**

Create file with:
```javascript
// Only set variables on success responses
if (pm.response.code >= 200 && pm.response.code < 300) {
  let json = null;
  try { json = pm.response.json(); } catch (e) {}
  if (json && json.data && json.data.tokens) {
    if (json.data.tokens.accessToken) pm.collectionVariables.set("accessToken", json.data.tokens.accessToken);
    if (json.data.tokens.refreshToken) pm.collectionVariables.set("refreshToken", json.data.tokens.refreshToken);
  }
  if (json && json.data && json.data.user) {
    if (json.data.user.id) pm.collectionVariables.set("userId", json.data.user.id);
    if (json.data.user.username) pm.collectionVariables.set("username", json.data.user.username);
  }
}
```

**Step 2: Paste into Post-response scripts**

Paste into Post-response tab for `POST /api/auth/login` and `POST /api/auth/register`.

**Step 3: Manual test**

Run login/register and verify in Collection Variables:
- `accessToken`, `refreshToken`, `userId`, `username` (if present)

---

### Task 2: Add Post-response script for Create Booking

**Files:**
- Modify: `docs/postman/scripts/bookings-create.post.js` (create)
- Modify: Collection request: `POST /api/bookings` (Post-response script)

**Step 1: Create booking script snippet**

```javascript
if (pm.response.code >= 200 && pm.response.code < 300) {
  let json = null;
  try { json = pm.response.json(); } catch (e) {}
  if (json && json.data) {
    if (json.data.id) pm.collectionVariables.set("bookingId", json.data.id);
    if (json.data.courtId) pm.collectionVariables.set("courtId", json.data.courtId);
    if (json.data.status) pm.collectionVariables.set("bookingStatus", json.data.status);
  }
}
```

**Step 2: Paste into Post-response script**

Paste into `POST /api/bookings`.

**Step 3: Manual test**

Run create booking and verify variables:
- `bookingId`, `courtId`, `bookingStatus`

---

### Task 3: Add Post-response script for Create Payment QR

**Files:**
- Modify: `docs/postman/scripts/payments-qr.post.js` (create)
- Modify: Collection request: `POST /api/payments/{bookingId}/qr` (Post-response script)

**Step 1: Create payment QR script snippet**

```javascript
if (pm.response.code >= 200 && pm.response.code < 300) {
  let json = null;
  try { json = pm.response.json(); } catch (e) {}
  if (json && json.data) {
    if (json.data.paymentTransactionId) pm.collectionVariables.set("paymentTransactionId", json.data.paymentTransactionId);
    if (json.data.qrString) pm.collectionVariables.set("paymentQrString", json.data.qrString);
    if (json.data.expiresAt) pm.collectionVariables.set("paymentExpiresAt", json.data.expiresAt);
  }
}
```

**Step 2: Paste into Post-response script**

Paste into `POST /api/payments/{bookingId}/qr`.

**Step 3: Manual test**

Run create payment QR and verify:
- `paymentTransactionId`, `paymentQrString`, `paymentExpiresAt`

---

### Task 4: Add Post-response script for Cancel Booking (optional)

**Files:**
- Modify: `docs/postman/scripts/bookings-cancel.post.js` (create)
- Modify: Collection request: `POST /api/bookings/{bookingId}/cancel` (Post-response script)

**Step 1: Create cancel booking script snippet**

```javascript
if (pm.response.code >= 200 && pm.response.code < 300) {
  let json = null;
  try { json = pm.response.json(); } catch (e) {}
  if (json && json.data) {
    if (json.data.refundPolicy) pm.collectionVariables.set("cancelRefundPolicy", json.data.refundPolicy);
    if (json.data.refundAmount !== undefined) pm.collectionVariables.set("cancelRefundAmount", String(json.data.refundAmount));
    if (json.data.refundTransactionId) pm.collectionVariables.set("refundTransactionId", json.data.refundTransactionId);
  }
}
```

**Step 2: Paste into Post-response script**

Paste into `POST /api/bookings/{bookingId}/cancel`.

**Step 3: Manual test**

Cancel booking and verify:
- `cancelRefundPolicy`, `cancelRefundAmount`, `refundTransactionId`

---

### Task 5: Document variable usage in collection

**Files:**
- Modify: `docs/postman/README.md` (create)

**Step 1: Create usage notes**

Include:
- Variable names list
- Which request sets each variable
- Example `Authorization` header: `Bearer {{accessToken}}`

**Step 2: Review**

Confirm README matches scripts.

---

Plan complete and saved to `docs/plans/2026-03-25-postman-vars-plan.md`. Two execution options:

1. Subagent-Driven (this session) - I dispatch fresh subagent per task, review between tasks, fast iteration
2. Parallel Session (separate) - Open new session with executing-plans, batch execution with checkpoints

Which approach?
