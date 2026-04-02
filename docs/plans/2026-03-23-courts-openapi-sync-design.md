# Courts OpenAPI Sync (Minimal)

## Goal
- Make `docs/api/courts.yaml` import into Postman as a request (not an empty folder) by aligning minimal OpenAPI metadata with other specs.

## Scope
- Add `tags`, `operationId`, and `security` to `/api/courts/available`.
- Add `components.securitySchemes.bearerAuth` at the document level.

## Non-Goals
- Do not change runtime behavior or endpoints.
- Do not merge specs into a single OpenAPI file.

## Proposed Changes
- `/api/courts/available`
  - `tags: [Courts]`
  - `operationId: getAvailableCourts`
  - `security: [{ bearerAuth: [] }]`
- `components.securitySchemes`
  - `bearerAuth` HTTP bearer JWT

## Success Criteria
- Importing `docs/api/courts.yaml` into Postman generates a request under `courts/available`.

## Risks
- Minimal: OpenAPI metadata only; no code changes.
