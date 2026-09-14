import { Schema } from "mongoose";

export type RewardEvent = "week_complete" | "redeemed" | "referral_sent";

export interface IRewardTransaction {
  userId: string;
  event: RewardEvent;
  starsEarned: number;
  starsRedeemed: number;
  balanceAfter: number;
  weekNumber?: number;
  relatedEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const RewardTransactionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    event: {
      type: String,
      enum: ["week_complete", "redeemed", "referral_sent"],
      required: true,
    },
    starsEarned: { type: Number, default: 0 },
    starsRedeemed: { type: Number, default: 0 },
    balanceAfter: { type: Number, required: true },
    weekNumber: { type: Number },
    relatedEmail: { type: String },
  },
  { timestamps: true, collection: "rewardtransactions" }
);
