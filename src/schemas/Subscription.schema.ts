import { Schema } from "mongoose";

export interface ISubscription {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: "active" | "canceled" | "incomplete" | "past_due";
  currentPeriodEnd: Date;
  createdAt: Date;
}

export const SubscriptionSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    userId: { type: String, required: true },
    stripeCustomerId: { type: String, required: true },
    stripeSubscriptionId: { type: String, required: true },
    stripePriceId: { type: String, required: true },
    status: { type: String, required: true },
    currentPeriodEnd: { type: Date },
    createdAt: { type: Date, default: Date.now }
  },
  { collection: "subscriptions" }
);