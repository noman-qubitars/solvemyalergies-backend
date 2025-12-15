import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../../../config/env";
import {
  createOtpToken,
  findLatestValidOtp,
  findLatestUnexpiredOtp,
  findLatestVerifiedOtp,
  findLatestUnexpiredUnverifiedOtp,
  markOtpAsVerified as markOtpAsVerifiedModel,
  markOtpAsUsed as markOtpAsUsedModel,
  IOtpTokenDocument,
} from "../../../models/OtpToken";

export const SALT_ROUNDS = 10;
export const OTP_LENGTH = 4;
export const OTP_EXPIRATION_MINUTES = 5;

export const createToken = (userId: string, role?: string): string => {
  const payload: { sub: string; role?: string } = { sub: userId };
  if (role) {
    payload.role = role;
  }
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "1d" });
};

export const generateOtpCode = (): string => {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

export const createOtpRecord = async (userId: string, code: string) => {
  const hashedCode = await bcrypt.hash(code, SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);
  return createOtpToken({
    code: hashedCode,
    expiresAt,
    userId
  });
};

export const getValidOtp = async (userId: string, code: string) => {
  const record = await findLatestValidOtp(userId);
  
  if (!record) {
    const expiredRecord = await findLatestUnexpiredOtp(userId);
    
    if (expiredRecord) {
      throw new Error("OTP code has expired. Please request a new code");
    }
    throw new Error("Invalid OTP code. Please check and try again");
  }
  
  const recordDoc = record as IOtpTokenDocument;
  const match = await bcrypt.compare(code, recordDoc.code);
  if (!match) {
    throw new Error("Invalid OTP code. Please check and try again");
  }
  
  return record;
};

export const getLatestUnusedOtp = async (userId: string) => {
  const now = new Date();
  const verifiedRecord = await findLatestVerifiedOtp(userId);
  
  if (verifiedRecord) {
    const recordDoc = verifiedRecord as IOtpTokenDocument;
    const verifiedTime = recordDoc.verifiedAt ? new Date(recordDoc.verifiedAt).getTime() : 0;
    const timeSinceVerification = now.getTime() - verifiedTime;
    const fiveMinutes = 5 * 60 * 1000;
    
    if (timeSinceVerification <= fiveMinutes) {
      return verifiedRecord;
    } else {
      throw new Error("OTP verification has expired. Please verify OTP again");
    }
  }
  
  const unexpiredRecord = await findLatestUnexpiredUnverifiedOtp(userId);
  
  if (unexpiredRecord) {
    throw new Error("Please verify OTP first");
  }
  
  throw new Error("No verified OTP found. Please verify OTP first");
};

export const markOtpAsVerified = async (otpId: string) => {
  return await markOtpAsVerifiedModel(otpId);
};

export const markOtpAsUsed = async (otpId: string) => {
  return await markOtpAsUsedModel(otpId);
};