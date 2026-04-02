import 'dotenv/config';

type JwtConfig = {
  privateKey: string;
  publicKey: string;
  ttl: string;
};

export type AppConfig = {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  redisUrl: string;
  logLevel: string;
  jwt: {
    access: JwtConfig;
    refresh: JwtConfig;
  };
  bcrypt: {
    saltRounds: number;
  };
  rateLimit: {
    windowMs: number;
    max: number;
    store?: 'memory' | 'redis';
  };
  booking: {
    expireMinutes: number;
    cancel: {
      refundRate: number;
      minHoursForRefund: number;
      timezone: string;
    };
  };
  payment: {
    timeoutMinutes: number;
    sepay: {
      merchantId?: string;
      secretKey?: string;
      apiBaseUrl?: string;
      apiToken?: string;
      webhookSecret?: string;
      ipnApiKey?: string;
      bankAccount?: string;
      bankName?: string;
      qrExpireMinutes: number;
    };
  };
};

const requiredVars = [
  'DATABASE_URL',
  'ACCESS_TOKEN_TTL',
  'REFRESH_TOKEN_TTL',
  'REDIS_URL',
];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

const hasAccessKey =
  process.env.JWT_ACCESS_PRIVATE_KEY ||
  process.env.JWT_ACCESS_PRIVATE_KEY_BASE64;
const hasAccessPub =
  process.env.JWT_ACCESS_PUBLIC_KEY ||
  process.env.JWT_ACCESS_PUBLIC_KEY_BASE64;
const hasRefreshKey =
  process.env.JWT_REFRESH_PRIVATE_KEY ||
  process.env.JWT_REFRESH_PRIVATE_KEY_BASE64;
const hasRefreshPub =
  process.env.JWT_REFRESH_PUBLIC_KEY ||
  process.env.JWT_REFRESH_PUBLIC_KEY_BASE64;

if (!hasAccessKey) {
  throw new Error(
    'Missing required environment variable: JWT_ACCESS_PRIVATE_KEY or JWT_ACCESS_PRIVATE_KEY_BASE64',
  );
}
if (!hasAccessPub) {
  throw new Error(
    'Missing required environment variable: JWT_ACCESS_PUBLIC_KEY or JWT_ACCESS_PUBLIC_KEY_BASE64',
  );
}
if (!hasRefreshKey) {
  throw new Error(
    'Missing required environment variable: JWT_REFRESH_PRIVATE_KEY or JWT_REFRESH_PRIVATE_KEY_BASE64',
  );
}
if (!hasRefreshPub) {
  throw new Error(
    'Missing required environment variable: JWT_REFRESH_PUBLIC_KEY or JWT_REFRESH_PUBLIC_KEY_BASE64',
  );
}

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable must be a number, got: ${value}`);
  }
  return parsed;
};

const config: AppConfig = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toNumber(process.env.PORT, 3000),
  databaseUrl: process.env.DATABASE_URL as string,
  redisUrl: process.env.REDIS_URL as string,
  logLevel: process.env.LOG_LEVEL ?? 'info',
  jwt: {
    access: {
      privateKey: process.env.JWT_ACCESS_PRIVATE_KEY as string,
      publicKey: process.env.JWT_ACCESS_PUBLIC_KEY as string,
      ttl: process.env.ACCESS_TOKEN_TTL ?? '15m',
    },
    refresh: {
      privateKey: process.env.JWT_REFRESH_PRIVATE_KEY as string,
      publicKey: process.env.JWT_REFRESH_PUBLIC_KEY as string,
      ttl: process.env.REFRESH_TOKEN_TTL ?? '30d',
    },
  },
  bcrypt: {
    saltRounds: toNumber(process.env.BCRYPT_SALT_ROUNDS, 12),
  },
  rateLimit: {
    windowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toNumber(process.env.RATE_LIMIT_MAX, 5),
    store:
      process.env.RATE_LIMIT_STORE === 'redis'
        ? 'redis'
        : ('memory' as 'memory' | 'redis'),
  },
  booking: {
    expireMinutes: toNumber(process.env.BOOKING_EXPIRE_MINUTES, 15),
    cancel: {
      refundRate: toNumber(process.env.BOOKING_CANCEL_REFUND_RATE, 0.7),
      minHoursForRefund: toNumber(
        process.env.BOOKING_CANCEL_MIN_HOURS_FOR_REFUND,
        24,
      ),
      timezone: process.env.BOOKING_CANCEL_TIMEZONE ?? 'Asia/Ho_Chi_Minh',
    },
  },
  payment: {
    timeoutMinutes: toNumber(process.env.PAYMENT_TIMEOUT_MINUTES, 10),
    sepay: {
      merchantId: process.env.SEPAY_MERCHANT_ID,
      secretKey: process.env.SEPAY_SECRET_KEY,
      apiBaseUrl: process.env.SEPAY_API_BASE_URL,
      apiToken: process.env.SEPAY_API_TOKEN,
      webhookSecret: process.env.SEPAY_WEBHOOK_SECRET,
      ipnApiKey: process.env.SEPAY_IPN_API_KEY,
      bankAccount: process.env.SEPAY_BANK_ACCOUNT,
      bankName: process.env.SEPAY_BANK_NAME,
      qrExpireMinutes: toNumber(process.env.SEPAY_QR_EXPIRE_MINUTES, 10),
    },
  },
};

export default config;
