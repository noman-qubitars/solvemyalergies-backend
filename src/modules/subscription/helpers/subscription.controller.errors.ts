import { Response } from "express";

export const handleControllerError = (error: unknown, res: Response, defaultMessage: string = "An error occurred") => {
  const message = error instanceof Error ? error.message : defaultMessage;
  return res.status(400).json({
    success: false,
    message,
  });
};

export const sendMissingFieldsError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "All fields are required",
  });
};

export const sendActiveSubscriptionExistsError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "You already have an active subscription",
  });
};

export const sendMissingStripeSignatureError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Missing stripe-signature header",
  });
};

export const sendWebhookSecretNotConfiguredError = (res: Response) => {
  return res.status(500).json({
    success: false,
    message: "Webhook secret not configured",
  });
};

export const sendWebhookSignatureVerificationError = (res: Response, errorMessage: string) => {
  return res.status(400).json({
    success: false,
    message: `Webhook signature verification failed: ${errorMessage}`,
  });
};

