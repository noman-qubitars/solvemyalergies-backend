import mongoose, { Document } from "mongoose";
import { OtpTokenSchema, IOtpToken } from "../schemas/OtpToken.schema";

export interface IOtpTokenDocument extends IOtpToken, Document {}

export const OtpTokenModel = mongoose.model<IOtpTokenDocument>("OtpToken", OtpTokenSchema);

export { OtpTokenModel as OtpToken };
export { IOtpToken, OtpTokenSchema };

export const createOtpToken = async (otpData: {
  code: string;
  expiresAt: Date;
  userId: string;
}) => {
  return await OtpTokenModel.create(otpData);
};

export const findOtpTokenById = async (otpId: string) => {
  return await OtpTokenModel.findById(otpId);
};

export const findLatestValidOtp = async (userId: string) => {
  const now = new Date();
  return await OtpTokenModel.findOne({
    userId,
    used: false,
    expiresAt: { $gt: now }
  }).sort({ createdAt: -1 });
};

export const findLatestUnexpiredOtp = async (userId: string) => {
  return await OtpTokenModel.findOne({
    userId,
    used: false
  }).sort({ createdAt: -1 });
};

export const findLatestVerifiedOtp = async (userId: string) => {
  return await OtpTokenModel.findOne({
    userId,
    used: false,
    verified: true
  }).sort({ verifiedAt: -1 });
};

export const findLatestUnexpiredUnverifiedOtp = async (userId: string) => {
  const now = new Date();
  return await OtpTokenModel.findOne({
    userId,
    used: false,
    expiresAt: { $gt: now }
  }).sort({ createdAt: -1 });
};

export const updateOtpTokenById = async (otpId: string, updateData: Partial<IOtpToken>) => {
  return await OtpTokenModel.findByIdAndUpdate(
    otpId,
    updateData,
    { new: true }
  );
};

export const markOtpAsVerified = async (otpId: string) => {
  return await OtpTokenModel.updateOne(
    { _id: otpId },
    { verified: true, verifiedAt: new Date() }
  );
};

export const markOtpAsUsed = async (otpId: string) => {
  return await OtpTokenModel.updateOne(
    { _id: otpId },
    { used: true }
  );
};

export const deleteOtpToken = async (otpId: string) => {
  return await OtpTokenModel.findByIdAndDelete(otpId);
};