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
