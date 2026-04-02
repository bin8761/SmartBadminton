# Payment Provider Interface + Registry Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement provider interface types and registry for SePay QR dynamic payments.

**Architecture:** Add a `providers` module with shared types, a registry singleton, and a SePay provider stub registration point.

**Tech Stack:** TypeScript, Node.js

---

### Task 1: Create provider types

**Files:**
- Create: `backend/src/modules/payments/providers/provider.types.ts`

**Step 1: Add types**

```ts
export type PaymentCreateQrInput = {
  bookingId: string;
  amount: number;
  currency: string;
  description: string;
};

export type PaymentCreateQrResult = {
  externalOrderId: string;
  externalRequestId?: string;
  qrString: string;
  raw: unknown;
};

export type PaymentVerifyInput = {
  externalOrderId: string;
};

export type PaymentVerifyResult = {
  status: 'PAID' | 'FAILED' | 'PENDING' | 'EXPIRED';
  paidAt?: Date;
  raw: unknown;
};

export type PaymentWebhookContext = {
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
};

export interface PaymentProvider {
  name: 'SEPAY';
  createQr(input: PaymentCreateQrInput): Promise<PaymentCreateQrResult>;
  validateSignature(context: PaymentWebhookContext): boolean;
  handleWebhook(context: PaymentWebhookContext): Promise<PaymentVerifyResult>;
  verify(input: PaymentVerifyInput): Promise<PaymentVerifyResult>;
}
```

**Step 2: Commit**

```bash
git add backend/src/modules/payments/providers/provider.types.ts
git commit -m "feat: add payment provider types"
```

### Task 2: Create provider registry

**Files:**
- Create: `backend/src/modules/payments/providers/provider.registry.ts`

**Step 1: Add registry implementation**

```ts
import type { PaymentProvider } from './provider.types';

type ProviderName = PaymentProvider['name'];

const providers = new Map<ProviderName, PaymentProvider>();

export const registerProvider = (provider: PaymentProvider) => {
  providers.set(provider.name, provider);
};

export const getProvider = (name: ProviderName) => providers.get(name);

export const getProviderOrThrow = (name: ProviderName) => {
  const provider = providers.get(name);
  if (!provider) {
    throw new Error(`Payment provider not registered: ${name}`);
  }
  return provider;
};
```

**Step 2: Commit**

```bash
git add backend/src/modules/payments/providers/provider.registry.ts
git commit -m "feat: add payment provider registry"
```

### Task 3: Add providers barrel export

**Files:**
- Create: `backend/src/modules/payments/providers/index.ts`

**Step 1: Add exports**

```ts
export * from './provider.types';
export * from './provider.registry';
```

**Step 2: Commit**

```bash
git add backend/src/modules/payments/providers/index.ts
git commit -m "feat: export payment provider registry"
```
