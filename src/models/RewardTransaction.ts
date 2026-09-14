import mongoose, { Document } from "mongoose";
import { RewardTransactionSchema, IRewardTransaction } from "../schemas/RewardTransaction.schema";

export interface IRewardTransactionDocument extends IRewardTransaction, Document {}

export const RewardTransactionModel = mongoose.model<IRewardTransactionDocument>(
  "RewardTransaction",
  RewardTransactionSchema
);

export { RewardTransactionModel as RewardTransaction };

export const createRewardTransaction = async (data: {
  userId: string;
  event: string;
  starsEarned?: number;
  starsRedeemed?: number;
  starsTransferred?: number;
  balanceAfter: number;
  weekNumber?: number;
  relatedEmail?: string;
  relatedUserId?: string;
}) => {
  return await RewardTransactionModel.create(data);
};

export const findRewardTransactionsByUser = async (userId: string) => {
  return await RewardTransactionModel.find({ userId }).sort({ createdAt: -1 });
};
