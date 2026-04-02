import {
  cancelBookingRequestSchema,
  validateCancelBookingPayload,
} from '../../../src/modules/bookings/validators/cancel-booking.validator';

describe('cancelBooking validator', () => {
  const validBookingId = '5f6f6f4c-64b7-4a5b-8f99-5e4b6f65f411';

  it('accepts reason with minimum length (10)', () => {
    const payload = {
      params: { bookingId: validBookingId },
      body: { reason: '1234567890' },
    };

    expect(() => validateCancelBookingPayload(payload)).not.toThrow();
  });

  it('accepts reason with maximum length (500)', () => {
    const payload = {
      params: { bookingId: validBookingId },
      body: { reason: 'a'.repeat(500) },
    };

    expect(() => validateCancelBookingPayload(payload)).not.toThrow();
  });

  it('rejects reason shorter than minimum length', () => {
    const result = cancelBookingRequestSchema.safeParse({
      params: { bookingId: validBookingId },
      body: { reason: '123456789' },
    });

    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only reason', () => {
    const result = cancelBookingRequestSchema.safeParse({
      params: { bookingId: validBookingId },
      body: { reason: '            ' },
    });

    expect(result.success).toBe(false);
  });

  it('rejects missing reason', () => {
    const result = cancelBookingRequestSchema.safeParse({
      params: { bookingId: validBookingId },
      body: {},
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid bookingId', () => {
    const result = cancelBookingRequestSchema.safeParse({
      params: { bookingId: 'invalid-uuid' },
      body: { reason: 'Ly do huy hop le' },
    });

    expect(result.success).toBe(false);
  });
});
