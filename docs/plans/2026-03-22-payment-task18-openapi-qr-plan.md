# Payment Task 18.1 OpenAPI QR Endpoint Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add OpenAPI documentation for `POST /api/payments/{bookingId}/qr` in a new payments spec file.

**Architecture:** Create a dedicated `docs/api/payments.yaml` with OpenAPI 3.0.3, include a shared `ErrorResponse` schema and the QR creation path with Bearer auth.

**Tech Stack:** OpenAPI 3.0.3 (YAML)

---

### Task 1: Create Payments OpenAPI File

**Files:**
- Create: `docs/api/payments.yaml`

**Step 1: Add OpenAPI header**
- `openapi: 3.0.3`
- `info` title/version for Payments API

**Step 2: Define security scheme**
- `components.securitySchemes.bearerAuth` with HTTP bearer

**Step 3: Add ErrorResponse schema**
- Mirror the `ErrorResponse` shape used in other API docs

**Step 4: Add QR create path**
- Path: `/api/payments/{bookingId}/qr`
- Method: `post`
- Auth: `bearerAuth`
- Path param: `bookingId` (uuid)
- Responses: `201`, `400`, `401`, `403`, `404`, `409`, `500`

**Step 5: Commit**
```bash
git add docs/api/payments.yaml
git commit -m "docs(api): add payments QR endpoint"
```

### Task 2: Update Task Checklist

**Files:**
- Modify: `task/payment-task-breakdown.md`

**Step 1: Mark Task 18.1 complete**

**Step 2: Commit**
```bash
git add task/payment-task-breakdown.md
git commit -m "docs(tasks): complete payment task 18.1"
```

---

## Notes
- Keep response schema consistent with controller output.
- Request body is omitted (no body).
