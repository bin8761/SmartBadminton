import express from "express";
import request from "supertest";
import { responseMiddleware } from "../../../src/shared/response";
import paymentRouter from "../../../src/routes/payment.routes";

jest.mock("../../../src/modules/payments/providers/sepay.provider", () => ({
  SepayProvider: jest.fn().mockImplementation(() => ({
    validateSignature: () => false,
  })),
}));

jest.mock("../../../src/modules/payments/controllers", () => {
  const actual = jest.requireActual("../../../src/modules/payments/controllers");
  return {
    ...actual,
    handleSepayWebhook: (
      _req: unknown,
      res: { status: (code: number) => { end: () => void } },
    ) => res.status(200).end(),
  };
});

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseMiddleware);
  app.use("/api/payments", paymentRouter);
  return app;
};

describe("payment routes", () => {
  it("rejects unauthenticated QR creation", async () => {
    const app = buildApp();
    const resp = await request(app).post(
      "/api/payments/00000000-0000-0000-0000-000000000000/qr",
    );
    expect(resp.status).toBe(401);
  });

  it("rejects invalid sepay webhook signature", async () => {
    const app = buildApp();
    const resp = await request(app)
      .post("/api/payments/webhooks/sepay")
      .send({});
    expect(resp.status).toBe(401);
    expect(resp.text).toBe("");
  });
});
