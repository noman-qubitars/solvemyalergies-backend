import mongoose, { Schema, Document } from "mongoose";

export interface IOtpToken extends Document {
  code: string;
  expiresAt: Date;
  used: boolean;
  verified: boolean;
  verifiedAt?: Date;
  userId: string;
  createdAt: Date;
}

const OtpTokenSchema = new Schema<IOtpToken>(
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

export const OtpToken = mongoose.model<IOtpToken>("OtpToken", OtpTokenSchema);