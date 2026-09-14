import mongoose, { Document } from "mongoose";
import { UserRewardSchema, IUserReward } from "../schemas/UserReward.schema";

export interface IUserRewardDocument extends IUserReward, Document {}

export const UserRewardModel = mongoose.model<IUserRewardDocument>("UserReward", UserRewardSchema);

export { UserRewardModel as UserReward };

export const getOrCreateUserReward = async (userId: string) => {
  let userReward = await UserRewardModel.findOne({ userId });
  if (!userReward) {
    userReward = await UserRewardModel.create({ userId });
  }
  return userReward;
};

export const findAllUserRewards = async (userIds: string[] | undefined, page: number = 1, limit: number = 10) => {
  const query: any = userIds ? { userId: { $in: userIds } } : {};
  const skip = (page - 1) * limit;
  const [rewards, total] = await Promise.all([
    UserRewardModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    UserRewardModel.countDocuments(query),
  ]);
  return { rewards, total };
};
