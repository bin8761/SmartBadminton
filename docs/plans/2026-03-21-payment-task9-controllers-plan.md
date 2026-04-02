# Payment Task 9 Controllers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add payment controllers for QR creation, SePay webhook handling, and verify, following existing response/error conventions.

**Architecture:** Thin Express controllers in `backend/src/modules/payments/controllers` that validate input, resolve user, call `paymentService`, map service errors, and format responses. Webhook returns `200` empty on success.

**Tech Stack:** Node.js, Express 5, Zod, Jest, supertest

---

### Task 1: Add controller tests (create QR + verify)

**Files:**
- Create: `backend/tests/modules/payments/payment.controller.test.ts`

**Step 1: Write the failing test**

```ts
import express from 'express';
import request from 'supertest';
import { responseMiddleware } from '../../../src/shared/response';
import {
  createPaymentQrHandler,
  verifyPaymentHandler,
} from '../../../src/modules/payments/controllers/payment.controller';
import { createPaymentQrService, verifyPaymentService } from '../../../src/modules/payments/services/payment.service';
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
    req.user = { username: 'u1', role: 'CUSTOMER', payload: { sub: 'u1', role: 'CUSTOMER' } };
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
    const resp = await request(app).post('/api/payments/booking-1/qr');

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
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/modules/payments/payment.controller.test.ts`
Expected: FAIL with "Cannot find module '../../../src/modules/payments/controllers/payment.controller'".

**Step 3: Write minimal implementation**

(Implemented in Task 2.)

**Step 4: Run test to verify it passes**

Run: `npx jest tests/modules/payments/payment.controller.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/modules/payments/payment.controller.test.ts
git commit -m "test: add payment controller coverage"
```

---

### Task 2: Implement payment controllers

**Files:**
- Create: `backend/src/modules/payments/controllers/payment.controller.ts`
- Create: `backend/src/modules/payments/controllers/index.ts`

**Step 1: Write the failing test**

(Already written in Task 1.)

**Step 2: Run test to verify it fails**

Run: `npx jest tests/modules/payments/payment.controller.test.ts`
Expected: FAIL due to missing controller implementations.

**Step 3: Write minimal implementation**

```ts
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import logger from '../../../shared/logger';
import { findUserByUsername } from '../../auth/repositories/user.repository';
import {
  createPaymentQrService,
  handlePaymentWebhookService,
  verifyPaymentService,
  ServiceError as PaymentServiceError,
} from '../services/payment.service';
import { createPaymentQrValidator, verifyPaymentValidator } from '../validators';
import { findLatestByBookingId } from '../repositories/payment.repository';

const toErrorDetails = (error: ZodError) =>
  error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));

export const createPaymentQrHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user?.username) {
      return res.fail({ code: 'UNAUTHORIZED', message: 'Chua dang nhap' }, 401);
    }

    const user = await findUserByUsername(req.user.username);
    if (!user) {
      return res.fail(
        { code: 'USER_NOT_FOUND', message: 'Nguoi dung khong ton tai' },
        404,
      );
    }

    const parsed = createPaymentQrValidator.parse({ params: req.params });
    const result = await createPaymentQrService({
      bookingId: parsed.params.bookingId,
      userId: user.id,
    });

    return res.success(result, 201);
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      return res.fail({ code: error.code, message: error.message }, error.status);
    }
    if (error instanceof ZodError) {
      return res.fail(
        { code: 'VALIDATION_ERROR', message: 'Du lieu khong hop le', details: toErrorDetails(error) },
        400,
      );
    }
    logger.error({ err: error }, 'create payment qr failed');
    return res.fail(
      { code: 'INTERNAL_ERROR', message: 'Khong the tao QR thanh toan' },
      500,
    );
  }
};

export const handleSepayWebhook = async (req: Request, res: Response) => {
  try {
    await handlePaymentWebhookService({
      headers: req.headers,
      body: req.body,
    });
    return res.status(200).end();
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      if (error.code === 'INVALID_SIGNATURE') {
        return res.status(401).end();
      }
      return res.fail({ code: error.code, message: error.message }, error.status);
    }
    logger.error({ err: error }, 'payment webhook failed');
    return res.fail(
      { code: 'INTERNAL_ERROR', message: 'Khong the xu ly webhook' },
      500,
    );
  }
};

export const verifyPaymentHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user?.username) {
      return res.fail({ code: 'UNAUTHORIZED', message: 'Chua dang nhap' }, 401);
    }

    const user = await findUserByUsername(req.user.username);
    if (!user) {
      return res.fail(
        { code: 'USER_NOT_FOUND', message: 'Nguoi dung khong ton tai' },
        404,
      );
    }

    const parsed = verifyPaymentValidator.parse({ body: req.body });
    const result = await verifyPaymentService({
      bookingId: parsed.body.bookingId,
      userId: user.id,
    });

    const latest = await findLatestByBookingId(parsed.body.bookingId);

    return res.success(
      {
        paymentTransactionId:
          (result.raw as { paymentTransactionId?: string } | undefined)
            ?.paymentTransactionId ?? latest?.id ?? null,
        paymentStatus: result.status,
        paidAt: result.paidAt ?? null,
        provider: latest?.provider ?? null,
        amount: latest?.amount ?? null,
        currency: latest?.currency ?? null,
      },
      200,
    );
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      return res.fail({ code: error.code, message: error.message }, error.status);
    }
    if (error instanceof ZodError) {
      return res.fail(
        { code: 'VALIDATION_ERROR', message: 'Du lieu khong hop le', details: toErrorDetails(error) },
        400,
      );
    }
    logger.error({ err: error }, 'verify payment failed');
    return res.fail(
      { code: 'INTERNAL_ERROR', message: 'Khong the xac minh thanh toan' },
      500,
    );
  }
};
```

```ts
export * from './payment.controller';
```

**Step 4: Run test to verify it passes**

Run: `npx jest tests/modules/payments/payment.controller.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/modules/payments/controllers/payment.controller.ts src/modules/payments/controllers/index.ts
git commit -m "feat: add payment controllers"
```

---

### Task 3: Sanity check (optional)

**Files:**
- None

**Step 1: Run TypeScript check (optional)**

Run: `npx tsc --noEmit`
Expected: May fail due to existing project-level issues (known in ledger). Ensure no new errors introduced by this task.

**Step 2: Commit (optional)**

```bash
git add -A
git commit -m "chore: verify payment controller compile"
```
