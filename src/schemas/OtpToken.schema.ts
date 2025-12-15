import { Schema } from "mongoose";

export interface IOtpToken {
  code: string;
  expiresAt: Date;
  used: boolean;
  verified: boolean;
  verifiedAt?: Date;
  userId: string;
  createdAt: Date;
}

export const OtpTokenSchema = new Schema(
  {
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    userId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { collection: "otptokens" }
);