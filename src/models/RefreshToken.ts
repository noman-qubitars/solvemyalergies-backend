import mongoose, { Document } from "mongoose";
import crypto from "crypto";
import { RefreshTokenSchema, IRefreshToken } from "../schemas/RefreshToken.schema";
import { config } from "../config/env";

export interface IRefreshTokenDocument extends IRefreshToken, Document {}

export const RefreshTokenModel = mongoose.model<IRefreshTokenDocument>("RefreshToken", RefreshTokenSchema);

export { RefreshTokenModel as RefreshToken };
export { IRefreshToken, RefreshTokenSchema };

const hashToken = (rawToken: string): string => {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};

export const issueRefreshToken = async (userId: string) => {
  const rawToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + config.refreshTokenExpiryHours * 60 * 60 * 1000);

  await RefreshTokenModel.create({
    userId,
    tokenHash: hashToken(rawToken),
    expiresAt,
    revoked: false
  });

  return { rawToken, expiresAt };
};

export const findValidRefreshToken = async (rawToken: string) => {
  return await RefreshTokenModel.findOne({
    tokenHash: hashToken(rawToken),
    revoked: false,
    expiresAt: { $gt: new Date() }
  });
};

export const revokeRefreshToken = async (rawToken: string) => {
  return await RefreshTokenModel.updateOne({ tokenHash: hashToken(rawToken) }, { revoked: true });
};

export const revokeAllRefreshTokensForUser = async (userId: string) => {
  return await RefreshTokenModel.updateMany({ userId, revoked: false }, { revoked: true });
};
