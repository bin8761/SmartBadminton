import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { rateLimitMiddleware } from "../middleware/rateLimit";
import { validate } from "../middleware/validate";
import {
  cancelBookingHandler,
  createBookingHandler,
} from "../modules/bookings/controllers/booking.controller";
import { cancelBookingValidator } from "../modules/bookings/validators/cancel-booking.validator";
import { createBookingValidator } from "../modules/bookings/validators/create-booking.validator";

const bookingRouter = Router();

bookingRouter.post(
  "/",
  authenticate,
  requireRole("CUSTOMER"),
  rateLimitMiddleware,
  validate(createBookingValidator),
  createBookingHandler,
);

bookingRouter.post(
  "/:bookingId/cancel",
  authenticate,
  requireRole("CUSTOMER"),
  validate(cancelBookingValidator),
  cancelBookingHandler,
);

export default bookingRouter;
