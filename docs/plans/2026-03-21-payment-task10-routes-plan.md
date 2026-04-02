# Payment Task 10 Routes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add payment routes, validation middleware for params+body, and mount the router in the app.

**Architecture:** Create a payment router under `backend/src/routes`, add a payment-specific validation middleware to parse `{ params, body }` with Zod, and wire routes with auth/role guards. Mount the router at `/api/payments` in `backend/src/app.ts`.

**Tech Stack:** Node.js, Express 5, Zod

---

### Task 1: Add payment route tests

**Files:**
- Create: `backend/tests/modules/payments/payment.routes.test.ts`

**Step 1: Write the failing test**

```ts
import express from 'express';
import request from 'supertest';
import { responseMiddleware } from '../../../src/shared/response';
import paymentRouter from '../../../src/routes/payment.routes';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseMiddleware);
  app.use('/api/payments', paymentRouter);
  return app;
};

describe('payment routes', () => {
  it('rejects unauthenticated QR creation', async () => {
    const app = buildApp();
    const resp = await request(app).post(
      '/api/payments/00000000-0000-0000-0000-000000000000/qr',
    );
    expect(resp.status).toBe(401);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/modules/payments/payment.routes.test.ts`
Expected: FAIL with "Cannot find module '../../../src/routes/payment.routes'".

**Step 3: Write minimal implementation**

(Implemented in Task 2.)

**Step 4: Run test to verify it passes**

Run: `npx jest tests/modules/payments/payment.routes.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/modules/payments/payment.routes.test.ts
git commit -m "test: add payment routes coverage"
```

---

### Task 2: Add payment validation middleware

**Files:**
- Create: `backend/src/modules/payments/middleware/validate-payment-request.ts`
- Create: `backend/src/modules/payments/middleware/index.ts`

**Step 1: Write the failing test**

(Already written in Task 1.)

**Step 2: Run test to verify it fails**

Run: `npx jest tests/modules/payments/payment.routes.test.ts`
Expected: FAIL due to missing middleware/route.

**Step 3: Write minimal implementation**

```ts
import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';
import logger from '../../../shared/logger';

export const validatePaymentRequest =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({ params: req.params, body: req.body });
      req.params = parsed.params ?? req.params;
      req.body = parsed.body ?? req.body;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        res.fail(
          {
            code: 'VALIDATION_ERROR',
            message: 'Du lieu khong hop le',
            details,
          },
          400,
        );
        return;
      }
      logger.error({ err: error }, 'payment validation middleware failed');
      res.fail(
        { code: 'INTERNAL_ERROR', message: 'Khong the xu ly yeu cau' },
        500,
      );
    }
  };
```

```ts
export * from './validate-payment-request';
```

**Step 4: Run test to verify it passes**

Run: `npx jest tests/modules/payments/payment.routes.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/modules/payments/middleware/validate-payment-request.ts src/modules/payments/middleware/index.ts
git commit -m "feat: add payment validation middleware"
```

---

### Task 3: Add payment routes and mount in app

**Files:**
- Create: `backend/src/routes/payment.routes.ts`
- Modify: `backend/src/app.ts`

**Step 1: Write the failing test**

(Already written in Task 1.)

**Step 2: Run test to verify it fails**

Run: `npx jest tests/modules/payments/payment.routes.test.ts`
Expected: FAIL due to missing routes.

**Step 3: Write minimal implementation**

```ts
import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  createPaymentQrHandler,
  handleSepayWebhook,
  verifyPaymentHandler,
} from '../modules/payments/controllers';
import { validatePaymentRequest } from '../modules/payments/middleware';
import {
  createPaymentQrValidator,
  verifyPaymentValidator,
} from '../modules/payments/validators';

const router = Router();

router.post(
  '/:bookingId/qr',
  authenticate,
  requireRole('CUSTOMER'),
  validatePaymentRequest(createPaymentQrValidator),
  createPaymentQrHandler,
);

router.post(
  '/verify',
  authenticate,
  requireRole('CUSTOMER'),
  validatePaymentRequest(verifyPaymentValidator),
  verifyPaymentHandler,
);

router.post('/webhooks/sepay', handleSepayWebhook);

export default router;
```

In `backend/src/app.ts`, mount the router:

```ts
import paymentRouter from './routes/payment.routes';

// ...
app.use('/api/payments', paymentRouter);
```

**Step 4: Run test to verify it passes**

Run: `npx jest tests/modules/payments/payment.routes.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/routes/payment.routes.ts src/app.ts
git commit -m "feat: add payment routes"
```

---

### Task 4: Sanity check (optional)

**Files:**
- None

**Step 1: Run TypeScript check (optional)**

Run: `npx tsc --noEmit`
Expected: May fail due to known project issues.

**Step 2: Commit (optional)**

```bash
git add -A
git commit -m "chore: verify payment routes compile"
```
