import mongoose, { Document } from "mongoose";
import { SubscriptionSchema, ISubscription } from "../schemas/Subscription.schema";

export interface ISubscriptionDocument extends ISubscription, Document {}

export const SubscriptionModel = mongoose.model<ISubscriptionDocument>("Subscription", SubscriptionSchema);

export { SubscriptionModel as Subscription };
export { ISubscription, SubscriptionSchema };

export const findSubscriptionByEmail = async (email: string) => {
  return await SubscriptionModel.findOne({ email });
};

export const findActiveSubscriptionByEmail = async (email: string) => {
  return await SubscriptionModel.findOne({ email, status: "active" });
};

export const findAllSubscriptions = async () => {
  return await SubscriptionModel.find().sort({ createdAt: -1 });
};

export const findSubscriptionById = async (subscriptionId: string) => {
  return await SubscriptionModel.findById(subscriptionId);
};

export const createSubscription = async (subscriptionData: Partial<ISubscription>) => {
  return await SubscriptionModel.create(subscriptionData);
};

export const updateSubscriptionByEmail = async (email: string, updateData: Partial<ISubscription>) => {
  return await SubscriptionModel.findOneAndUpdate(
    { email },
    updateData,
    { new: true }
  );
};

export const updateSubscriptionById = async (subscriptionId: string, updateData: Partial<ISubscription>) => {
  return await SubscriptionModel.findByIdAndUpdate(
    subscriptionId,
    updateData,
    { new: true }
  );
};