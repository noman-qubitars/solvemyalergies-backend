import { Request, Response } from "express";
import Stripe from "stripe";
import { config } from "../../config/env";
import {
  createCheckoutSession,
  handleWebhookEvent,
} from "./subscription.service";
import { findActiveSubscriptionByEmail } from "../../models/Subscription";
import {
  handleControllerError,
  sendMissingFieldsError,
  sendActiveSubscriptionExistsError,
  sendMissingStripeSignatureError,
  sendWebhookSecretNotConfiguredError,
  sendWebhookSignatureVerificationError,
} from "./helpers/subscription.controller.errors";
import {
  validateCheckoutFields,
  getFrontendUrl,
  buildSuccessUrl,
  buildCancelUrl,
} from "./helpers/subscription.controller.utils";

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

export const createCheckout = async (req: Request, res: Response) => {
  try {
    const validation = validateCheckoutFields(req.body);
    
    if (!validation.valid) {
      return sendMissingFieldsError(res);
    }

    const { email, firstName, lastName, phone } = req.body;

    const existingSubscription = await findActiveSubscriptionByEmail(email);
    if (existingSubscription) {
      return sendActiveSubscriptionExistsError(res);
    }

    const frontendUrl = getFrontendUrl(req);
    const successUrl = buildSuccessUrl(frontendUrl);
    const cancelUrl = buildCancelUrl(frontendUrl);

    const result = await createCheckoutSession(
      { email, firstName, lastName, phone },
      successUrl,
      cancelUrl
    );

    res.status(200).json(result);
  } catch (error: any) {
    return handleControllerError(error, res, "Failed to create checkout session");
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return sendMissingStripeSignatureError(res);
  }

  if (!config.stripe.webhookSecret) {
    return sendWebhookSecretNotConfiguredError(res);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return sendWebhookSignatureVerificationError(res, err.message);
  }

  try {
    await handleWebhookEvent(event);
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    console.error("Event type:", event.type);
    console.error("Event ID:", event.id);
    res.status(200).json({ received: true, error: error.message });
  }
};