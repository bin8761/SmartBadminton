# Fix Zod v4 Cancel Booking Validator Design

Date: 2026-03-23

## Summary
Update cancel-booking validator to be compatible with Zod v4 by removing `required_error`/`invalid_type_error` options and preserving existing validation messages.

## Scope
- Modify `backend/src/modules/bookings/validators/cancel-booking.validator.ts` only.
- Preserve validation messages and trimming behavior.

## Approach
- Use `z.preprocess` to normalize `undefined/null` and detect non-string inputs.
- Use `superRefine` to emit the same required/invalid/length messages.
- Trim and return the final string.

## Non-Goals
- No dependency changes.
- No controller/service changes.

## Testing
- No tests added in this fix.
