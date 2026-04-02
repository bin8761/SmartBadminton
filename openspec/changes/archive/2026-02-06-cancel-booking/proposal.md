## Why

Customers currently can complete booking and payment but do not have a defined cancellation flow afterward. We need a clear, auditable cancellation capability to handle post-payment changes, reduce support friction, and enforce consistent refund policy behavior.

## What Changes

- Add a customer self-service cancellation flow for paid bookings.
- Enforce eligibility rules before canceling (authenticated customer, owns booking, booking is in cancellable paid state).
- Persist cancellation metadata and refund decision outcome for internal/manual refund processing in Phase 1.
- Return deterministic API responses for success and non-cancellable scenarios.

## Capabilities

### New Capabilities
- `cancel-booking`: Allow a customer to cancel their own paid booking and record cancellation/refund outcomes according to policy.

### Modified Capabilities
- None.

## Impact

- `backend/src/modules/bookings/*`: add cancel validator/service/repository/controller flow.
- `backend/src/routes/booking.routes.ts`: add cancel endpoint wiring and middleware.
- `backend/prisma/schema.prisma`: cancellation and refund persistence fields/models.
- `docs/api/bookings.yaml`: document cancel booking contract and error codes.
- Operational process: introduce internal/manual refund handling records for canceled paid bookings.