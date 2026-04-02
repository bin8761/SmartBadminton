# Payment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement MOMO sandbox payment flow after booking, using a provider-plugin architecture that is open to future gateways.

**Architecture:** Add a payments module with a provider registry, a MOMO adapter, webhook + client verify endpoints, and a separate payment-timeout worker. Store payment state in a PaymentTransaction model linked 1:1 with Booking.

**Tech Stack:** Node.js, Express, TypeScript, Prisma, BullMQ, Zod, pino

---

### Task 1: Add payment data model (Prisma)

**Files:**
- Modify: `backend/prisma/schema.prisma`

**Step 1: Write the failing test**
- Not applicable for Prisma schema. Use Prisma validation as a check.

**Step 2: Update Prisma schema**
```prisma
enum PaymentProvider {
  MOMO
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  EXPIRED
  CANCELED
}

model PaymentTransaction {
  id                String          @id @default(uuid())
  bookingId         String          @unique
  booking           Booking         @relation(fields: [bookingId], references: [id])
  provider          PaymentProvider
  status            PaymentStatus   @default(PENDING)
  amount            Int
  currency          String          @default("VND")
  externalOrderId   String
  externalRequestId String?
  payUrl            String?
  meta              Json?
  paidAt            DateTime?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@unique([provider, externalOrderId])
  @@index([status, createdAt])
}
```

**Step 3: Run schema validation**
Run: `npx prisma validate --schema backend/prisma/schema.prisma`
Expected: PASS

**Step 4: Commit**
```bash
git add backend/prisma/schema.prisma
git commit -m "feat: add payment transaction model"
```

---

### Task 2: Add payment configuration

**Files:**
- Modify: `backend/src/config/env.ts`
- Modify: `backend/.env.example`

**Step 1: Add env entries**
```ts
// env.ts additions
paymentTimeoutMinutes: z.coerce.number().default(10),

momo: {
  partnerCode: z.string(),
  accessKey: z.string(),
  secretKey: z.string(),
  endpoint: z.string().url(),
  redirectUrl: z.string().url(),
  ipnUrl: z.string().url(),
},
```

```env
# .env.example additions
PAYMENT_TIMEOUT_MINUTES=10
MOMO_PARTNER_CODE=
MOMO_ACCESS_KEY=
MOMO_SECRET_KEY=
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=http://localhost:3000/payment/callback
MOMO_IPN_URL=http://localhost:4000/api/payments/webhooks/momo
```

**Step 2: Commit**
```bash
git add backend/src/config/env.ts backend/.env.example
git commit -m "feat: add payment config"
```

---

### Task 3: Create payments module types and provider interface

**Files:**
- Create: `backend/src/modules/payments/types/payment.ts`
- Create: `backend/src/modules/payments/providers/provider.ts`

**Step 1: Write minimal types**
```ts
// payment.ts
export type PaymentProviderKey = "MOMO";
export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "EXPIRED" | "CANCELED";
```

```ts
// provider.ts
export interface PaymentSessionInput {
  bookingId: string;
  amount: number;
  orderInfo: string;
}

export interface PaymentSessionResult {
  externalOrderId: string;
  externalRequestId?: string;
  payUrl: string;
}

export interface PaymentVerifyInput {
  externalOrderId: string;
}

export interface PaymentVerifyResult {
  status: "SUCCEEDED" | "FAILED";
  paidAt?: Date;
}

export interface PaymentProvider {
  createSession(input: PaymentSessionInput): Promise<PaymentSessionResult>;
  verify(input: PaymentVerifyInput): Promise<PaymentVerifyResult>;
  parseWebhook(payload: unknown): PaymentVerifyResult & { externalOrderId: string };
}
```

**Step 2: Commit**
```bash
git add backend/src/modules/payments/types/payment.ts backend/src/modules/payments/providers/provider.ts
git commit -m "feat: add payment types and provider interface"
```

---

### Task 4: Add PaymentTransaction repository

**Files:**
- Create: `backend/src/modules/payments/repositories/payment.repository.ts`

**Step 1: Implement repository**
```ts
import prisma from "../../../shared/prisma";

export const paymentRepository = {
  create: (data: any) => prisma.paymentTransaction.create({ data }),
  findByBookingId: (bookingId: string) => prisma.paymentTransaction.findUnique({ where: { bookingId } }),
  updateStatus: (id: string, status: string, paidAt?: Date) =>
    prisma.paymentTransaction.update({ where: { id }, data: { status, paidAt } }),
};
```

**Step 2: Commit**
```bash
git add backend/src/modules/payments/repositories/payment.repository.ts
git commit -m "feat: add payment repository"
```

---

### Task 5: Implement MOMO sandbox provider adapter

**Files:**
- Create: `backend/src/modules/payments/providers/momo.provider.ts`

**Step 1: Implement adapter skeleton**
```ts
import config from "../../../config/env";
import type { PaymentProvider, PaymentSessionInput, PaymentSessionResult, PaymentVerifyInput, PaymentVerifyResult } from "./provider";

export const momoProvider: PaymentProvider = {
  async createSession(input: PaymentSessionInput): Promise<PaymentSessionResult> {
    // call MOMO create endpoint (sandbox)
    return {
      externalOrderId: `ORDER_${input.bookingId}`,
      externalRequestId: `REQ_${input.bookingId}`,
      payUrl: "https://test-payment.momo.vn/pay/mock-url",
    };
  },

  async verify(input: PaymentVerifyInput): Promise<PaymentVerifyResult> {
    // call MOMO query endpoint
    return { status: "SUCCEEDED", paidAt: new Date() };
  },

  parseWebhook(payload: unknown) {
    // parse and map payload fields
    return { externalOrderId: "", status: "SUCCEEDED", paidAt: new Date() };
  },
};
```

**Step 2: Commit**
```bash
git add backend/src/modules/payments/providers/momo.provider.ts
git commit -m "feat: add MOMO sandbox provider adapter"
```

---

### Task 6: Payment service and registry

**Files:**
- Create: `backend/src/modules/payments/providers/registry.ts`
- Create: `backend/src/modules/payments/services/payment.service.ts`

**Step 1: Registry**
```ts
import { momoProvider } from "./momo.provider";
import type { PaymentProvider } from "./provider";

const providers: Record<string, PaymentProvider> = {
  MOMO: momoProvider,
};

export const paymentProviderRegistry = {
  get: (key: string) => providers[key],
};
```

**Step 2: Service skeleton**
```ts
import { paymentProviderRegistry } from "../providers/registry";
import { paymentRepository } from "../repositories/payment.repository";

export const paymentService = {
  async createSession(booking: any) {
    const provider = paymentProviderRegistry.get("MOMO");
    const session = await provider.createSession({
      bookingId: booking.id,
      amount: booking.totalPrice,
      orderInfo: `Booking ${booking.id}`,
    });
    return paymentRepository.create({
      bookingId: booking.id,
      provider: "MOMO",
      status: "PENDING",
      amount: booking.totalPrice,
      externalOrderId: session.externalOrderId,
      externalRequestId: session.externalRequestId,
      payUrl: session.payUrl,
    });
  },
};
```

**Step 3: Commit**
```bash
git add backend/src/modules/payments/providers/registry.ts backend/src/modules/payments/services/payment.service.ts
git commit -m "feat: add payment provider registry and service"
```

---

### Task 7: Controllers, routes, and validation

**Files:**
- Create: `backend/src/modules/payments/controllers/payment.controller.ts`
- Create: `backend/src/modules/payments/validators/payment.validator.ts`
- Create: `backend/src/routes/payment.routes.ts`
- Modify: `backend/src/app.ts`

**Step 1: Validator**
```ts
import { z } from "zod";

export const createSessionValidator = z.object({
  params: z.object({ bookingId: z.string().uuid() }),
});
```

**Step 2: Controller skeleton**
```ts
export const createPaymentSessionHandler = async (req, res) => {
  // load booking, check ownership and PENDING_PAYMENT
  // call paymentService.createSession
  return res.success({ /* paymentUrl + expiresAt */ });
};
```

**Step 3: Route**
```ts
paymentRouter.post("/:bookingId/session", authenticate, requireRole("CUSTOMER"), validate(createSessionValidator), createPaymentSessionHandler);
```

**Step 4: Commit**
```bash
git add backend/src/modules/payments/controllers/payment.controller.ts backend/src/modules/payments/validators/payment.validator.ts backend/src/routes/payment.routes.ts backend/src/app.ts
git commit -m "feat: add payment endpoints"
```

---

### Task 8: Payment-timeout worker

**Files:**
- Create: `backend/src/workers/payment-timeout.worker.ts`
- Create: `backend/src/workers/payment-timeout.runner.ts`
- Modify: `backend/src/shared/queue.ts`
- Modify: `backend/src/app.ts`

**Step 1: Worker skeleton**
```ts
// payment-timeout.worker.ts
export const handlePaymentTimeout = async (job) => {
  const { bookingId } = job.data;
  // if booking still PENDING_PAYMENT, mark EXPIRED and update PaymentTransaction
};
```

**Step 2: Wire runner and queue**
```ts
// queue.ts
export const paymentQueue = new Queue("payment");
```

**Step 3: Commit**
```bash
git add backend/src/workers/payment-timeout.worker.ts backend/src/workers/payment-timeout.runner.ts backend/src/shared/queue.ts backend/src/app.ts
git commit -m "feat: add payment-timeout worker"
```

---

### Task 9: Logging and metrics

**Files:**
- Modify: `backend/src/shared/metrics.ts`
- Modify: `backend/src/modules/payments/services/payment.service.ts`

**Step 1: Metrics definitions**
```ts
export const paymentsCreatedTotal = new Counter({ name: "payments_created_total", help: "..." });
export const paymentsSucceededTotal = new Counter({ name: "payments_succeeded_total", help: "..." });
export const paymentsFailedTotal = new Counter({ name: "payments_failed_total", help: "..." });
```

**Step 2: Add structured logs**
```ts
logger.info({ event: "payment_session_created", bookingId });
```

**Step 3: Commit**
```bash
git add backend/src/shared/metrics.ts backend/src/modules/payments/services/payment.service.ts
git commit -m "feat: add payment logging and metrics"
```

---

### Task 10: OpenAPI and docs

**Files:**
- Modify: `docs/api/bookings.yaml` (or add `docs/api/payments.yaml`)
- Modify: `docs/setup.md`
- Modify: `docs/ops.md`

**Step 1: Document payment endpoints**
- Add request/response schemas and error codes.

**Step 2: Commit**
```bash
git add docs/api/bookings.yaml docs/setup.md docs/ops.md
git commit -m "docs: add payment endpoints"
```

---

### Task 11: Tests (unit + integration)

**Files:**
- Create: `backend/tests/modules/payments/payment.service.test.ts`
- Create: `backend/tests/integration/payment.contract.test.ts`

**Step 1: Write a failing unit test**
```ts
it("creates payment session for PENDING_PAYMENT booking", async () => {
  // expect paymentService.createSession to return payUrl
});
```

**Step 2: Run test (expected to fail)**
Run: `npx jest tests/modules/payments/payment.service.test.ts`
Expected: FAIL (implementation missing or jest config)

**Step 3: Implement missing logic, rerun**

**Step 4: Commit**
```bash
git add backend/tests/modules/payments/payment.service.test.ts backend/src/modules/payments/services/payment.service.ts
git commit -m "test: add payment service tests"
```

---

### Task 12: Prisma migration (user-run)

**Files:**
- Modify: `backend/prisma/migrations/<timestamp>_payment/migration.sql`

**Step 1: User runs migration**
Run: `npx prisma migrate dev --schema backend/prisma/schema.prisma -n payment`
Expected: Migration created and applied

**Step 2: Commit migration**
```bash
git add backend/prisma/migrations
git commit -m "chore: add payment migration"
```

---

## Notes
- All Prisma commands must be run by the user.
- MOMO integration should start with sandbox credentials.
- Webhook signature verification must be implemented before production.
