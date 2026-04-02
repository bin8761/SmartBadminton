# Courts OpenAPI Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `docs/api/courts.yaml` import into Postman as a request by adding minimal OpenAPI metadata (tags, operationId, bearer auth).

**Architecture:** Update OpenAPI spec only. No runtime changes. Align metadata with other API specs so Postman generates requests consistently.

**Tech Stack:** OpenAPI 3.0 YAML.

---

### Task 1: Add minimal metadata to `docs/api/courts.yaml`

**Files:**
- Modify: `docs/api/courts.yaml`

**Step 1: Update OpenAPI metadata**

Add:
- `tags: [Courts]`
- `operationId: getAvailableCourts`
- `security: [{ bearerAuth: [] }]`
- `components.securitySchemes.bearerAuth` (HTTP bearer JWT)

**Step 2: Verify in Postman**

Re-import `docs/api/courts.yaml` as **Collection** and confirm request appears under `courts/available`.

**Step 3: Commit**

```bash
git add docs/api/courts.yaml docs/plans/2026-03-23-courts-openapi-sync-design.md docs/plans/2026-03-23-courts-openapi-sync-plan.md
git commit -m "docs: align courts openapi metadata"
```
