import { Counter, Histogram, Registry } from 'prom-client';

export const metricsRegistry = new Registry();

export const registrationSuccessCounter = new Counter({
  name: 'auth_registration_success_total',
  help: 'Total successful user registrations',
  registers: [metricsRegistry],
});

export const registrationFailureCounter = new Counter({
  name: 'auth_registration_failure_total',
  help: 'Total failed user registrations',
  registers: [metricsRegistry],
});

export const registrationDurationHistogram = new Histogram({
  name: 'auth_registration_duration_ms',
  help: 'Registration latency (milliseconds)',
  buckets: [50, 100, 200, 400, 800, 1600, 3200],
  registers: [metricsRegistry],
});

export const loginSuccessCounter = new Counter({
  name: 'auth_login_success_total',
  help: 'Total successful user logins',
  registers: [metricsRegistry],
});

export const loginFailureCounter = new Counter({
  name: 'auth_login_failure_total',
  help: 'Total failed user logins',
  registers: [metricsRegistry],
});

export const loginDurationHistogram = new Histogram({
  name: 'auth_login_duration_ms',
  help: 'Login latency (milliseconds)',
  buckets: [50, 100, 200, 400, 800, 1600, 3200],
  registers: [metricsRegistry],
});

export const availableCourtsSearchCounter = new Counter({
  name: 'courts_available_search_total',
  help: 'Total available courts searches',
  registers: [metricsRegistry],
});

export const availableCourtsEmptyCounter = new Counter({
  name: 'courts_available_empty_total',
  help: 'Total available courts searches with empty result',
  registers: [metricsRegistry],
});

export const availableCourtsDurationHistogram = new Histogram({
  name: 'courts_available_duration_ms',
  help: 'Available courts search latency (milliseconds)',
  buckets: [50, 100, 200, 400, 800, 1600, 3200],
  registers: [metricsRegistry],
});

export const bookingsCreatedCounter = new Counter({
  name: 'bookings_created_total',
  help: 'Total successful booking creations',
  registers: [metricsRegistry],
});

export const bookingsCreateDurationHistogram = new Histogram({
  name: 'bookings_create_latency_ms',
  help: 'Booking creation latency (milliseconds)',
  buckets: [50, 100, 200, 400, 800, 1600, 3200],
  registers: [metricsRegistry],
});

export const bookingsExpiredCounter = new Counter({
  name: 'bookings_expired_total',
  help: 'Total bookings expired',
  registers: [metricsRegistry],
});

export const bookingsCanceledCounter = new Counter({
  name: 'bookings_canceled_total',
  help: 'Total booking cancellation attempts by result and refund policy',
  labelNames: ['result', 'refund_policy'],
  registers: [metricsRegistry],
});

export const bookingsCancelDurationHistogram = new Histogram({
  name: 'bookings_cancel_latency_ms',
  help: 'Booking cancellation latency (milliseconds)',
  buckets: [50, 100, 200, 400, 800, 1600, 3200],
  registers: [metricsRegistry],
});

export const refundManualPendingCounter = new Counter({
  name: 'refund_manual_pending_total',
  help: 'Total refund records created in manual pending state',
  registers: [metricsRegistry],
});

export const paymentsSuccessCounter = new Counter({
  name: 'payments_success_total',
  help: 'Total successful payments',
  labelNames: ['provider', 'result'],
  registers: [metricsRegistry],
});

export const paymentsFailureCounter = new Counter({
  name: 'payments_failure_total',
  help: 'Total failed payments',
  labelNames: ['provider', 'result'],
  registers: [metricsRegistry],
});

export const paymentsLatencyHistogram = new Histogram({
  name: 'payments_latency_ms',
  help: 'Payment processing latency (milliseconds)',
  labelNames: ['provider', 'flow'],
  buckets: [50, 100, 200, 400, 800, 1600, 3200],
  registers: [metricsRegistry],
});

export const getMetricsSnapshot = (): Promise<string> =>
  metricsRegistry.metrics();
