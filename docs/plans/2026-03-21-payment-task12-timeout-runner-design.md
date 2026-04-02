# Payment Task 12.2 Runner Design

**Date:** 2026-03-21

## Goal
Register the payment-timeout worker using a dedicated runner process, separate from the API server.

## Scope
- Add a new runner file that imports the payment-timeout worker.
- Expose a npm script to run the payment worker independently.

## Design
- File: `backend/src/workers/payment-timeout.runner.ts`
  - Import `./payment-timeout.worker` to register the worker.
  - Log a startup message.
- `backend/package.json`
  - Add script: `worker:payment-timeout` -> `ts-node src/workers/payment-timeout.runner.ts`

## Notes
- Keep API bootstrap (`app.ts`) unchanged.
- This matches the existing booking expire worker pattern (runner + optional bootstrap).
