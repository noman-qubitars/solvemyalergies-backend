import mongoose, { Document } from "mongoose";
import { TokenBlacklistSchema, ITokenBlacklist } from "../schemas/TokenBlacklist.schema";

export interface ITokenBlacklistDocument extends ITokenBlacklist, Document {}

export const TokenBlacklistModel = mongoose.model<ITokenBlacklistDocument>("TokenBlacklist", TokenBlacklistSchema);

export { TokenBlacklistModel as TokenBlacklist };
export { ITokenBlacklist, TokenBlacklistSchema };

export const addTokenToBlacklist = async (token: string, userId: string, expiresAt: Date) => {
  return await TokenBlacklistModel.create({
    token,
    userId,
    expiresAt
  });
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const blacklistedToken = await TokenBlacklistModel.findOne({ token });
  return !!blacklistedToken;
};

export const removeExpiredTokens = async () => {
  const now = new Date();
  return await TokenBlacklistModel.deleteMany({ expiresAt: { $lt: now } });
};

export const blacklistAllUserTokens = async (userId: string) => {
  return await TokenBlacklistModel.deleteMany({ userId });
};