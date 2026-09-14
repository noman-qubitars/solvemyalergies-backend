import { Schema } from "mongoose";

export type RewardEvent =
  | "week_complete"
  | "redeemed"
  | "referral_sent"
  | "transfer_sent"
  | "transfer_received";

export interface IRewardTransaction {
  userId: string;
  event: RewardEvent;
  starsEarned: number;
  starsRedeemed: number;
  starsTransferred: number;
  balanceAfter: number;
  weekNumber?: number;
  relatedEmail?: string;
  relatedUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const RewardTransactionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    event: {
      type: String,
      enum: ["week_complete", "redeemed", "referral_sent", "transfer_sent", "transfer_received"],
      required: true,
    },
    starsEarned: { type: Number, default: 0 },
    starsRedeemed: { type: Number, default: 0 },
    starsTransferred: { type: Number, default: 0 },
    balanceAfter: { type: Number, required: true },
    weekNumber: { type: Number },
    relatedEmail: { type: String },
    relatedUserId: { type: String },
  },
  { timestamps: true, collection: "rewardtransactions" }
);
