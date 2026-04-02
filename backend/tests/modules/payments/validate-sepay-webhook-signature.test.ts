import express from "express";
import request from "supertest";
import { responseMiddleware } from "../../../src/shared/response";
import { validateSepayWebhookSignature } from "../../../src/modules/payments/middleware/validate-sepay-webhook-signature";
import { SepayProvider } from "../../../src/modules/payments/providers/sepay.provider";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseMiddleware);
  app.post("/webhooks/sepay", validateSepayWebhookSignature, (_req, res) => {
    res.status(200).end();
  });
  return app;
};

describe("validateSepayWebhookSignature", () => {
  it("returns 401 when signature invalid", async () => {
    jest
      .spyOn(SepayProvider.prototype, "validateSignature")
      .mockReturnValue(false);
    const app = buildApp();
    const resp = await request(app).post("/webhooks/sepay").send({});
    expect(resp.status).toBe(401);
    expect(resp.text).toBe("");
  });

  it("calls next when signature valid", async () => {
    jest
      .spyOn(SepayProvider.prototype, "validateSignature")
      .mockReturnValue(true);
    const app = buildApp();
    const resp = await request(app).post("/webhooks/sepay").send({});
    expect(resp.status).toBe(200);
  });
});
