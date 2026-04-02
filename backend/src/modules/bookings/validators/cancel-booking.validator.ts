import { z } from "zod";

export const cancelBookingParamsSchema = z.object({
  bookingId: z.string().uuid("BookingId khong hop le"),
});

export const cancelBookingBodySchema = z.object({
  reason: z.preprocess(
    (value) => {
      if (value === undefined || value === null) {
        return "";
      }
      if (typeof value !== "string") {
        return "__INVALID_TYPE__";
      }
      return value;
    },
    z
      .string()
      .superRefine((val, ctx) => {
        if (val === "__INVALID_TYPE__") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Ly do huy dat san khong hop le",
          });
          return;
        }
        const trimmed = val.trim();
        if (trimmed.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Ly do huy dat san la bat buoc",
          });
          return;
        }
        if (trimmed.length < 10 || trimmed.length > 500) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Ly do huy dat san phai tu 10 den 500 ky tu",
          });
        }
      })
      .transform((val) =>
        val === "__INVALID_TYPE__" ? "" : val.trim(),
      ),
  ),
});

export const cancelBookingRequestSchema = z.object({
  params: cancelBookingParamsSchema,
  body: cancelBookingBodySchema,
});

export type CancelBookingParamsInput = z.infer<typeof cancelBookingParamsSchema>;
export type CancelBookingBodyInput = z.infer<typeof cancelBookingBodySchema>;
export type CancelBookingRequestInput = z.infer<typeof cancelBookingRequestSchema>;

export const validateCancelBookingPayload = (
  payload: unknown,
): CancelBookingRequestInput => cancelBookingRequestSchema.parse(payload);

export const cancelBookingValidator = cancelBookingBodySchema;
