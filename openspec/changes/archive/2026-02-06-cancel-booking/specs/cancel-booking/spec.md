## ADDED Requirements

### Requirement: Customer can cancel own paid booking
The system MUST allow an authenticated customer to cancel a booking only when the booking belongs to that customer and the booking status is `PAID`.

#### Scenario: Successful cancellation for owned paid booking
- **WHEN** an authenticated `CUSTOMER` submits cancellation for their own booking with status `PAID`
- **THEN** the system MUST change booking status to `CANCELED`
- **AND** the system MUST persist cancellation metadata including `canceledAt`, `canceledBy`, and `cancelReason`

#### Scenario: Reject cancellation for booking not owned by customer
- **WHEN** an authenticated `CUSTOMER` submits cancellation for a booking owned by another user
- **THEN** the system MUST reject the request with error code `BOOKING_NOT_OWNED`
- **AND** the booking state MUST remain unchanged

#### Scenario: Reject cancellation for non-cancellable status
- **WHEN** an authenticated `CUSTOMER` submits cancellation for a booking whose status is not `PAID`
- **THEN** the system MUST reject the request with error code `BOOKING_STATUS_NOT_CANCELLABLE`
- **AND** the booking state MUST remain unchanged

### Requirement: Refund policy is determined by exact 24-hour threshold in Vietnam timezone
The system MUST determine refund policy from the difference between cancellation time and rental `startTime` using timezone `Asia/Ho_Chi_Minh` and threshold `24` hours.

#### Scenario: Refund 70 percent when cancellation is at least 24 hours before start
- **WHEN** cancellation occurs at or before the point exactly 24 hours before booking `startTime`
- **THEN** the system MUST set `refundPolicy` to `REFUND_70`
- **AND** the system MUST set `refundAmount` to 70% of booking total price

#### Scenario: No refund when cancellation is less than 24 hours before start
- **WHEN** cancellation occurs after the point exactly 24 hours before booking `startTime`
- **THEN** the system MUST set `refundPolicy` to `NO_REFUND`
- **AND** the system MUST set `refundAmount` to `0`

### Requirement: Cancellation and refund records are created atomically
The system MUST persist booking cancellation update and one linked `RefundTransaction` record in a single transaction.

#### Scenario: Atomic persistence on successful cancellation
- **WHEN** a valid cancellation request is processed
- **THEN** the system MUST commit booking status update and linked refund transaction together
- **AND** the system MUST not leave partial state where only one of them is written

#### Scenario: Single refund transaction per booking
- **WHEN** cancellation is processed for a booking that already has a refund transaction
- **THEN** the system MUST prevent creating a duplicate refund transaction
- **AND** the system MUST return a deterministic conflict response

### Requirement: API contract returns deterministic success and error semantics
The system MUST return stable response structure and agreed error codes for cancellation outcomes.

#### Scenario: Success response for no-refund case
- **WHEN** cancellation is accepted but refund policy is `NO_REFUND`
- **THEN** the API MUST return success with `refundAmount=0` and `refundPolicy=NO_REFUND`
- **AND** the response MUST include refund status for manual processing lifecycle

#### Scenario: Validation error for invalid cancel reason
- **WHEN** cancellation request has missing, whitespace-only, or out-of-range reason length
- **THEN** the system MUST reject the request with error code `INVALID_CANCEL_REASON`
- **AND** the API MUST not perform any booking update

#### Scenario: Not found error for unknown booking id
- **WHEN** cancellation request references a booking id that does not exist
- **THEN** the system MUST reject the request with error code `BOOKING_NOT_FOUND`
- **AND** the API MUST return the standard error payload shape