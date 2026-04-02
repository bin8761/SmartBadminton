import { Queue, QueueOptions } from "bullmq";
import config from "../config/env";

const buildConnection = (): QueueOptions["connection"] => {
  const url = new URL(config.redisUrl);
  const port = url.port ? Number(url.port) : 6379;
  if (Number.isNaN(port)) {
    throw new Error(`Invalid REDIS_URL port: ${url.port}`);
  }

  return {
    host: url.hostname,
    port,
    username: url.username || undefined,
    password: url.password || undefined,
  };
};

export const bookingExpireQueue = new Queue("booking-expire", {
  connection: buildConnection(),
});

export const paymentQueue = new Queue("payment", {
  connection: buildConnection(),
});

const PAYMENT_TIMEOUT_JOB = "payment-timeout";

type PaymentTimeoutOptions = {
  attempts?: number;
  backoffDelayMs?: number;
  removeOnComplete?: boolean;
  removeOnFail?: number;
};

export const enqueuePaymentTimeout = (
  bookingId: string,
  delayMs: number,
  options?: PaymentTimeoutOptions,
) =>
  paymentQueue.add(
    PAYMENT_TIMEOUT_JOB,
    { bookingId },
    {
      delay: delayMs,
      jobId: bookingId,
      attempts: options?.attempts ?? 3,
      backoff: {
        type: "exponential",
        delay: options?.backoffDelayMs ?? 5000,
      },
      removeOnComplete: options?.removeOnComplete ?? true,
      removeOnFail: options?.removeOnFail ?? 50,
    },
  );

export const findPaymentJob = (bookingId: string) =>
  paymentQueue.getJob(bookingId);

export const removePaymentJob = async (bookingId: string) => {
  const job = await paymentQueue.getJob(bookingId);
  if (!job) {
    return false;
  }
  await job.remove();
  return true;
};
