import { Schema } from "mongoose";

export interface IUserReward {
  userId: string;
  currentBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  totalTransferred: number;
  totalReferred: number;
  completedWeeks: number[];
  createdAt: Date;
  updatedAt: Date;
}

export const UserRewardSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    currentBalance: { type: Number, required: true, default: 0 },
    totalEarned: { type: Number, required: true, default: 0 },
    totalRedeemed: { type: Number, required: true, default: 0 },
    totalTransferred: { type: Number, required: true, default: 0 },
    totalReferred: { type: Number, required: true, default: 0 },
    completedWeeks: { type: [Number], default: [] },
  },
  { timestamps: true, collection: "userrewards" }
);
