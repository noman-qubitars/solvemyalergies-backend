import { Request, Response } from "express";
import Stripe from "stripe";
import { config } from "../../config/env";
import { createCheckoutSession, handleCheckoutSuccess, handleWebhookEvent } from "./subscription.service";
import { Subscription } from "../../models/Subscription";

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: "2025-11-17.clover",
  typescript: true
});

export const createCheckout = async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, phone } = req.body;

    if (!email || !firstName || !lastName || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const existingSubscription = await Subscription.findOne({ email, status: "active" });
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "You already have an active subscription"
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || req.headers.origin || "http://localhost:3000";
    const successUrl = `${frontendUrl}/webinar/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}/webinar/subscription?canceled=true`;

    const result = await createCheckoutSession(
      { email, firstName, lastName, phone },
      successUrl,
      cancelUrl
    );

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create checkout session"
    });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required"
      });
    }

    const result = await handleCheckoutSuccess(sessionId);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Payment verification failed"
    });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).json({
      success: false,
      message: "Missing stripe-signature header"
    });
  }

  if (!config.stripe.webhookSecret) {
    return res.status(500).json({
      success: false,
      message: "Webhook secret not configured"
    });
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
    return res.status(400).json({
      success: false,
      message: `Webhook signature verification failed: ${err.message}`
    });
  }

  try {
    await handleWebhookEvent(event);
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Webhook processing failed"
    });
  }
};