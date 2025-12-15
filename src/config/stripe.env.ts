import { required } from "./env.utils";

const env = process.env;

export const stripeConfig = {
  publishableKey: required("STRIPE_PUBLISHABLE_KEY"),
  secretKey: required("STRIPE_SECRET_KEY"),
  webhookSecret: env.STRIPE_WEBHOOK_SECRET || "",
};

