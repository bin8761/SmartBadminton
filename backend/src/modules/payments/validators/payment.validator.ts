import { z } from "zod";

export const createPaymentQrValidator = z.object({
  params: z.object({
    bookingId: z.string().uuid(),
  }),
});

export const verifyPaymentValidator = z.object({
  body: z.object({
    bookingId: z.string().uuid(),
  }),
});
