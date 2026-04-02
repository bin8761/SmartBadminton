import type { NextFunction, Request, Response } from "express";
import { SepayProvider } from "../providers/sepay.provider";

const provider = new SepayProvider();

export const validateSepayWebhookSignature = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const ok = provider.validateSignature({
    headers: req.headers,
    body: req.body,
  });

  if (!ok) {
    return res.status(401).end();
  }

  return next();
};
