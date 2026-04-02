export const REFUND_POLICY = {
  REFUND_70: "REFUND_70",
  NO_REFUND: "NO_REFUND",
} as const;

export type RefundPolicy = (typeof REFUND_POLICY)[keyof typeof REFUND_POLICY];

export const REFUND_STATUS = {
  PENDING_MANUAL: "PENDING_MANUAL",
  COMPLETED_MANUAL: "COMPLETED_MANUAL",
  REJECTED_MANUAL: "REJECTED_MANUAL",
} as const;

export type RefundStatus = (typeof REFUND_STATUS)[keyof typeof REFUND_STATUS];
