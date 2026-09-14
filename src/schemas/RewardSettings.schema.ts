import { Schema } from "mongoose";

export interface IRewardSettings {
  rewardValuePerStar: number;
  minimumRedemption: number;
  expireEnabled: boolean;
  expireMonths: number;
  fraudPreventionEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const RewardSettingsSchema = new Schema(
  {
    rewardValuePerStar: { type: Number, required: true, default: 0.2 },
    minimumRedemption: { type: Number, required: true, default: 50 },
    expireEnabled: { type: Boolean, default: false },
    expireMonths: { type: Number, default: 6 },
    fraudPreventionEnabled: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "rewardsettings" }
);
