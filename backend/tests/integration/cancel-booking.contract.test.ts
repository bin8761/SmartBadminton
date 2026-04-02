import request from 'supertest';
import express from 'express';
import { matchers } from 'jest-openapi';
import fs from 'fs';
import path from 'path';
import bookingRouter from '../../src/routes/booking.routes';
import { responseMiddleware } from '../../src/shared/response';
import * as userRepo from '../../src/modules/auth/repositories/user.repository';
import * as cancelBookingServiceModule from '../../src/modules/bookings/services/cancel-booking.service';

jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { username: 'customer.seed', role: 'CUSTOMER', payload: {} };
    next();
  },
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../src/middleware/validate', () => ({
  validate: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../src/modules/auth/repositories/user.repository');
jest.mock('../../src/modules/bookings/services/cancel-booking.service');

expect.extend(matchers);

const specPath = path.join(__dirname, '../../../docs/api/bookings.yaml');
const spec = fs.readFileSync(specPath, 'utf-8');

const appFactory = () => {
  const app = express();
  app.use(responseMiddleware);
  app.use(express.json());
  app.use('/api/bookings', bookingRouter);
  return app;
};

describe('API contract for /api/bookings/{bookingId}/cancel', () => {
  const bookingId = '5f6f6f4c-64b7-4a5b-8f99-5e4b6f65f411';
  const mockRepo = userRepo as jest.Mocked<typeof userRepo>;
  const mockCancelService =
    cancelBookingServiceModule as jest.Mocked<typeof cancelBookingServiceModule>;

  beforeEach(() => {
    jest.resetAllMocks();
    mockRepo.findUserByUsername.mockResolvedValue({
      id: 'user-id',
      username: 'customer.seed',
      passwordHash: 'hashed',
      fullName: 'Seed User',
      phone: '+84900000001',
      email: 'seed@example.com',
      role: 'CUSTOMER',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  });

  it('matches OpenAPI success schema', async () => {
    mockCancelService.cancelBookingService.mockResolvedValue({
      bookingId,
      status: 'CANCELED' as any,
      canceledAt: new Date(),
      refundPolicy: 'NO_REFUND',
      refundAmount: 0,
      refundStatus: 'COMPLETED_MANUAL',
      refundTransactionId: 'de4cf1ea-cf2d-48b9-a8a6-cea3d266551f',
    });

    const res = await request(appFactory())
      .post(`/api/bookings/${bookingId}/cancel`)
      .send({ reason: 'Ban viec dot xuat, khong the den san' });

    expect(res).toSatisfyApiSpec(spec);
  });

  it('matches OpenAPI error schema', async () => {
    mockCancelService.cancelBookingService.mockRejectedValue(
      new cancelBookingServiceModule.ServiceError(
        'BOOKING_NOT_FOUND',
        404,
        'Khong tim thay don dat san',
      ),
    );

    const res = await request(appFactory())
      .post(`/api/bookings/${bookingId}/cancel`)
      .send({ reason: 'Ban viec dot xuat, khong the den san' });

    expect(res).toSatisfyApiSpec(spec);
  });
});
