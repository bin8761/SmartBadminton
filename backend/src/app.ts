import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import authRouter from "./routes/auth.routes";
import courtRouter from "./routes/court.routes";
import bookingRouter from "./routes/booking.routes";
import paymentRouter from "./routes/payment.routes";
const enableWorker = process.env.BOOKING_EXPIRE_WORKER === "true";
if (enableWorker) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("./workers/booking-expire.worker");
}
import { responseMiddleware } from "./shared/response";
import config from "./config/env";
import prisma from "./shared/prisma";

const app = express();
app.set("trust proxy", true);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(responseMiddleware);

app.use("/api/auth", authRouter);
app.use("/api/courts", courtRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/payments", paymentRouter);

const port = config.port;

const startServer = async () => {
  try {
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log("Database connected successfully");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Database connection failed", error);
    process.exit(1);
  }

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port`, port);
  });
};

void startServer();
