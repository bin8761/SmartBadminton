import express from 'express';
import request from 'supertest';
import { responseMiddleware } from '../../../src/shared/response';
import {
  createPaymentQrHandler,
  verifyPaymentHandler,
} from '../../../src/modules/payments/controllers/payment.controller';
import {
  createPaymentQrService,
  verifyPaymentService,
} from '../../../src/modules/payments/services/payment.service';
import { findUserByUsername } from '../../../src/modules/auth/repositories/user.repository';

jest.mock('../../../src/modules/payments/services/payment.service');
jest.mock('../../../src/modules/auth/repositories/user.repository');

const mockFindUser = findUserByUsername as jest.Mock;
const mockCreateQr = createPaymentQrService as jest.Mock;
const mockVerify = verifyPaymentService as jest.Mock;

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseMiddleware);
  app.use((req, _res, next) => {
    req.user = {
      username: 'u1',
      role: 'CUSTOMER',
      payload: { sub: 'u1', role: 'CUSTOMER' },
    };
    next();
  });
  app.post('/api/payments/:bookingId/qr', createPaymentQrHandler);
  app.post('/api/payments/verify', verifyPaymentHandler);
  return app;
};

describe('payment controllers', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates payment QR', async () => {
    mockFindUser.mockResolvedValue({ id: 'user-1', role: 'CUSTOMER' });
    mockCreateQr.mockResolvedValue({
      paymentTransactionId: 'pt-1',
      qrString: 'qr-data',
      expiresAt: new Date('2026-03-21T00:00:00.000Z'),
    });

    const app = buildApp();
    const resp = await request(app).post(
      '/api/payments/00000000-0000-0000-0000-000000000000/qr',
    );

    expect(resp.status).toBe(201);
    expect(resp.body.data.paymentTransactionId).toBe('pt-1');
    expect(resp.body.data.qrString).toBe('qr-data');
  });

  it('verifies payment and returns payment-only fields', async () => {
    mockFindUser.mockResolvedValue({ id: 'user-1', role: 'CUSTOMER' });
    mockVerify.mockResolvedValue({
      status: 'PAID',
      paidAt: new Date('2026-03-21T01:00:00.000Z'),
      raw: { paymentTransactionId: 'pt-1' },
    });

    const app = buildApp();
    const resp = await request(app)
      .post('/api/payments/verify')
      .send({ bookingId: '00000000-0000-0000-0000-000000000000' });

    expect(resp.status).toBe(200);
    expect(resp.body.data.paymentStatus).toBe('PAID');
    expect(resp.body.data.paymentTransactionId).toBe('pt-1');
  });
});
