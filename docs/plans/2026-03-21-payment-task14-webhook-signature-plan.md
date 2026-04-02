# Payment Task 14.1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add SePay webhook signature validation middleware and wire it to `/api/payments/webhooks/sepay`.

**Architecture:** Introduce a middleware that delegates signature checks to `SepayProvider.validateSignature` and returns `401` with an empty body on invalid requests. Wire it only on the SePay webhook route.

**Tech Stack:** Node.js, Express, TypeScript, Jest, Supertest

---

### Task 1: Add SePay webhook signature middleware

**Files:**
- Create: `backend/src/modules/payments/middleware/validate-sepay-webhook-signature.ts`
- Modify: `backend/src/modules/payments/middleware/index.ts`
- Test: `backend/tests/modules/payments/validate-sepay-webhook-signature.test.ts`

**Step 1: Write the failing test**

```ts
import request from 'supertest';
import express from 'express';
import { responseMiddleware } from '../../src/shared/response';
import { validateSepayWebhookSignature } from '../../src/modules/payments/middleware/validate-sepay-webhook-signature';
import { SepayProvider } from '../../src/modules/payments/providers/sepay.provider';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseMiddleware);
  app.post('/webhooks/sepay', validateSepayWebhookSignature, (_req, res) => {
    res.status(200).end();
  });
  return app;
};

describe('validateSepayWebhookSignature', () => {
  it('returns 401 when signature invalid', async () => {
    jest.spyOn(SepayProvider.prototype, 'validateSignature').mockReturnValue(false);
    const app = buildApp();
    const resp = await request(app).post('/webhooks/sepay').send({});
    expect(resp.status).toBe(401);
    expect(resp.text).toBe('');
  });

  it('calls next when signature valid', async () => {
    jest.spyOn(SepayProvider.prototype, 'validateSignature').mockReturnValue(true);
    const app = buildApp();
    const resp = await request(app).post('/webhooks/sepay').send({});
    expect(resp.status).toBe(200);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/modules/payments/validate-sepay-webhook-signature.test.ts`
Expected: FAIL with “Cannot find module … validate-sepay-webhook-signature”.

**Step 3: Write minimal implementation**

```ts
import type { Request, Response, NextFunction } from 'express';
import { SepayProvider } from '../providers/sepay.provider';

const provider = new SepayProvider();

export const validateSepayWebhookSignature = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const ok = provider.validateSignature({
    headers: req.headers,
    body: req.body,
  });

  if (!ok) {
    return res.status(401).end();
  }

  return next();
};
```

Update index export:

```ts
export * from './validate-payment-request';
export * from './validate-sepay-webhook-signature';
```

**Step 4: Run test to verify it passes**

Run: `npx jest tests/modules/payments/validate-sepay-webhook-signature.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/modules/payments/middleware/validate-sepay-webhook-signature.ts \
  backend/src/modules/payments/middleware/index.ts \
  backend/tests/modules/payments/validate-sepay-webhook-signature.test.ts
git commit -m "test: add sepay webhook signature middleware"
```

---

### Task 2: Wire middleware to SePay webhook route

**Files:**
- Modify: `backend/src/routes/payment.routes.ts`
- Test: `backend/tests/modules/payments/payment.routes.test.ts`

**Step 1: Write the failing test**

```ts
import request from 'supertest';
import express from 'express';
import paymentRouter from '../../src/routes/payment.routes';

jest.mock('../../src/modules/payments/controllers', () => ({
  handleSepayWebhook: (_req: unknown, res: { status: (code: number) => { end: () => void } }) => res.status(200).end(),
}));

jest.mock('../../src/modules/payments/providers/sepay.provider', () => ({
  SepayProvider: jest.fn().mockImplementation(() => ({
    validateSignature: () => false,
  })),
}));

describe('payment routes - sepay webhook', () => {
  it('returns 401 when signature invalid', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/payments', paymentRouter);

    const resp = await request(app)
      .post('/api/payments/webhooks/sepay')
      .send({});

    expect(resp.status).toBe(401);
    expect(resp.text).toBe('');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/modules/payments/payment.routes.test.ts -t "sepay webhook"`
Expected: FAIL (middleware not wired).

**Step 3: Write minimal implementation**

```ts
import { validateSepayWebhookSignature } from '../modules/payments/middleware';

router.post('/webhooks/sepay', validateSepayWebhookSignature, handleSepayWebhook);
```

**Step 4: Run test to verify it passes**

Run: `npx jest tests/modules/payments/payment.routes.test.ts -t "sepay webhook"`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/routes/payment.routes.ts \
  backend/tests/modules/payments/payment.routes.test.ts
git commit -m "feat: add sepay webhook signature middleware"
```
