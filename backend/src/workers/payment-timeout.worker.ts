import { Worker } from "bullmq";
import { BookingStatus, PaymentStatus } from "@prisma/client";
import logger from "../shared/logger";
import prisma from "../shared/prisma";
import { paymentQueue } from "../shared/queue";
import {
  paymentsFailureCounter,
  paymentsLatencyHistogram,
  paymentsSuccessCounter,
} from "../shared/metrics";

const worker = new Worker(
  paymentQueue.name,
  async (job) => {
    const startedAt = Date.now();
    if (job.name !== "payment-timeout") {
      return;
    }

    const bookingId = job.data?.bookingId as string | undefined;
    if (!bookingId) {
      logger.warn({ jobId: job.id }, "payment timeout job missing bookingId");
      return;
    }

    logger.info({ bookingId, jobId: job.id }, "payment_timeout_started");

    await prisma.$transaction(async (tx) => {
      const latest = await tx.paymentTransaction.findFirst({
        where: { bookingId },
        orderBy: { createdAt: "desc" },
      });

      if (!latest || latest.status !== PaymentStatus.PENDING) {
        logger.info({ bookingId, jobId: job.id }, "payment_timeout_skipped");
        paymentsFailureCounter
          .labels("SEPAY", "failure")
          .inc();
        paymentsLatencyHistogram
          .labels("SEPAY", "timeout")
          .observe(Date.now() - startedAt);
        return;
      }

      await tx.paymentTransaction.update({
        where: { id: latest.id },
        data: { status: PaymentStatus.EXPIRED },
      });

      await tx.booking.updateMany({
        where: { id: bookingId, status: BookingStatus.PENDING_PAYMENT },
        data: { status: BookingStatus.EXPIRED },
      });
    });

    logger.info({ bookingId, jobId: job.id }, "payment_timeout_completed");
    paymentsSuccessCounter
      .labels("SEPAY", "success")
      .inc();
    paymentsLatencyHistogram
      .labels("SEPAY", "timeout")
      .observe(Date.now() - startedAt);
  },
  { connection: paymentQueue.opts.connection },
);

worker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "payment timeout worker failed");
  paymentsFailureCounter
    .labels("SEPAY", "failure")
    .inc();
});
