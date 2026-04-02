# Payment Task 18.3 OpenAPI SePay Webhook Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add OpenAPI documentation for `POST /api/payments/webhooks/sepay` reflecting signature validation with `Authorization: Apikey <SEPAY_IPN_API_KEY>`.

**Architecture:** Extend `docs/api/payments.yaml` with a webhook path and an `apiKey` security scheme for the SePay IPN header.

**Tech Stack:** OpenAPI 3.0.3 (YAML)

---

### Task 1: Add SePay Webhook To Payments OpenAPI

**Files:**
- Modify: `docs/api/payments.yaml`

**Step 1: Add security scheme**
- `components.securitySchemes.sepayApiKey` (apiKey, header, Authorization)

**Step 2: Add webhook path**
- Path: `/api/payments/webhooks/sepay`
- Method: `post`
- Auth: `sepayApiKey`
- Body: SePay IPN payload fields
- Responses: `200` (empty), `401` (empty), `500` ErrorResponse

**Step 3: Commit**
```bash
git add docs/api/payments.yaml
git commit -m "docs(api): add sepay webhook endpoint"
```

### Task 2: Update Task Checklist

**Files:**
- Modify: `task/payment-task-breakdown.md`

**Step 1: Mark Task 18.3 complete**

**Step 2: Commit**
```bash
git add task/payment-task-breakdown.md
git commit -m "docs(tasks): complete payment task 18.3"
```

---

## Notes
- Keep webhook responses empty body for 200/401 per code.
