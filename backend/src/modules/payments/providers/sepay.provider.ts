import config from '../../../config/env';
import type {
  PaymentCreateQrInput,
  PaymentCreateQrResult,
  PaymentProvider,
  PaymentVerifyInput,
  PaymentVerifyResult,
  PaymentWebhookContext,
} from './provider.types';

type SepayIpnPayload = {
  payment_code?: string | null;
  content?: string | null;
  transaction_content?: string | null;
  amount?: number | string | null;
  transfer_type?: string | null;
  transaction_id?: string | number | null;
  transaction_date?: string | null;
};

const buildQrUrl = (
  account: string,
  bank: string,
  amount: number,
  description: string,
) =>
  `https://qr.sepay.vn/img?acc=${encodeURIComponent(account)}` +
  `&bank=${encodeURIComponent(bank)}` +
  `&amount=${amount}` +
  `&des=${encodeURIComponent(description)}`;

const parseBookingId = (
  paymentCode?: string | null,
  content?: string | null,
  transactionContent?: string | null,
) => {
  if (paymentCode) return paymentCode;
  const source = content ?? transactionContent;
  if (!source) return undefined;
  const match = source.match(/SB_([0-9a-fA-F-]{36})/);
  return match?.[1];
};

const parsePaidAt = (value?: string | null) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toNumber = (value: number | string | null | undefined) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const resolveAuthorization = (header: string | string[] | undefined) => {
  if (Array.isArray(header)) return header[0];
  return header;
};

export class SepayProvider implements PaymentProvider {
  name: 'SEPAY' = 'SEPAY';

  async createQr(input: PaymentCreateQrInput): Promise<PaymentCreateQrResult> {
    const { sepay } = config.payment;
    if (!sepay.bankAccount || !sepay.bankName) {
      throw new Error('SePay bank account or bank name is not configured');
    }

    const description = `SB_${input.bookingId}`;
    const qrString = buildQrUrl(
      sepay.bankAccount,
      sepay.bankName,
      input.amount,
      description,
    );

    return {
      externalOrderId: input.bookingId,
      qrString,
      raw: {
        bookingId: input.bookingId,
        description,
      },
    };
  }

  validateSignature(context: PaymentWebhookContext): boolean {
    const { sepay } = config.payment;
    const header =
      resolveAuthorization(context.headers.authorization) ||
      resolveAuthorization(context.headers.Authorization);

    if (!sepay.ipnApiKey || !header) {
      return false;
    }

    return header.trim() === `Apikey ${sepay.ipnApiKey}`;
  }

  async handleWebhook(
    context: PaymentWebhookContext,
  ): Promise<PaymentVerifyResult> {
    const payload = context.body as SepayIpnPayload;
    const paymentCode = payload?.payment_code;
    const content = payload?.content;
    const transactionContent = payload?.transaction_content;
    const amount = toNumber(payload?.amount) ?? 0;
    const transferType = payload?.transfer_type ?? undefined;
    const bookingId = parseBookingId(paymentCode, content, transactionContent);
    const paidAt = parsePaidAt(payload?.transaction_date);

    const status: PaymentVerifyResult['status'] =
      transferType === 'credit' && amount > 0 ? 'PAID' : 'FAILED';

    return {
      status,
      paidAt: status === 'PAID' ? paidAt : undefined,
      raw: {
        ...payload,
        bookingId,
      },
    };
  }

  async verify(input: PaymentVerifyInput): Promise<PaymentVerifyResult> {
    const { sepay } = config.payment;
    if (!sepay.apiBaseUrl || !sepay.apiToken) {
      throw new Error('SePay API base URL or token is not configured');
    }

    const url = new URL('/v1/transaction', sepay.apiBaseUrl);
    url.searchParams.set('transfer_type', 'credit');
    url.searchParams.set('content', `SB_${input.externalOrderId}`);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${sepay.apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`SePay verify failed with status ${response.status}`);
    }

    const data = (await response.json()) as {
      data?: Array<SepayIpnPayload>;
    };

    const match = data?.data?.[0];
    const amount = toNumber(match?.amount) ?? 0;
    const transferType = match?.transfer_type ?? undefined;
    const paidAt = parsePaidAt(match?.transaction_date);

    const status: PaymentVerifyResult['status'] =
      transferType === 'credit' && amount > 0 ? 'PAID' : 'PENDING';

    return {
      status,
      paidAt: status === 'PAID' ? paidAt : undefined,
      raw: match ?? data,
    };
  }
}
