import mongoose, { Document } from "mongoose";
import { RewardSettingsSchema, IRewardSettings } from "../schemas/RewardSettings.schema";

export interface IRewardSettingsDocument extends IRewardSettings, Document {}

export const RewardSettingsModel = mongoose.model<IRewardSettingsDocument>(
  "RewardSettings",
  RewardSettingsSchema
);

export { RewardSettingsModel as RewardSettings };

// Settings are a single, app-wide record — create it on first read if missing.
export const getOrCreateRewardSettings = async () => {
  let settings = await RewardSettingsModel.findOne();
  if (!settings) {
    settings = await RewardSettingsModel.create({});
  }
  return settings;
};
