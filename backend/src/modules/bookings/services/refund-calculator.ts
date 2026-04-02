import config from "../../../config/env";
import { REFUND_POLICY, RefundPolicy } from "../types/refund";

const HOUR_IN_MS = 60 * 60 * 1000;

type RefundPolicyInput = {
  startTime: Date;
  canceledAt?: Date;
  minHoursForRefund?: number;
  timezone?: string;
};

const toTimeInZone = (date: Date, timeZone: string): number => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return Date.UTC(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    Number(get("hour")),
    Number(get("minute")),
    Number(get("second")),
  );
};

export const calculateRefundPolicy = ({
  startTime,
  canceledAt = new Date(),
  minHoursForRefund = config.booking.cancel.minHoursForRefund,
  timezone = config.booking.cancel.timezone,
}: RefundPolicyInput): RefundPolicy => {
  const startInZone = toTimeInZone(startTime, timezone);
  const canceledInZone = toTimeInZone(canceledAt, timezone);
  const thresholdMs = minHoursForRefund * HOUR_IN_MS;

  return startInZone - canceledInZone >= thresholdMs
    ? REFUND_POLICY.REFUND_70
    : REFUND_POLICY.NO_REFUND;
};
