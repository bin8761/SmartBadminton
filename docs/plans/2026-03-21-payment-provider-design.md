# Payment Provider Interface + Registry Design (SePay QR Dynamic)

## Summary
This design introduces a payment provider interface and registry to support SePay QR dynamic flow with webhook signature validation and verify. The registry centralizes provider lookup and ensures consistent error handling across controllers/services.

## Goals
- Define a minimal, testable provider interface for QR creation, webhook verification, and status verification.
- Enable pluggable providers via a registry with explicit error handling.
- Keep contract stable for future providers.

## Non-Goals
- Implement SePay API integration (handled in Task 5).
- Implement controllers/services (handled in later tasks).

## Interface
Proposed TypeScript interface and supporting types:

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

## Registry
- `registerProvider(provider)` stores provider instance by `provider.name`.
- `getProviderOrThrow(name)` returns provider or throws a descriptive error.
- `getProvider(name)` returns provider or `undefined`.

## Error Handling
- `validateSignature` returns `false` for invalid signature → controller returns `401`.
- `handleWebhook` only called after signature validation.
- Registry throws a clear error for unknown providers to avoid silent failures.

## Usage
- Controllers/services obtain provider via registry.
- SePay implementation registers itself in the registry during module initialization.

## Open Questions
- None.
