import { Schema } from "mongoose";

export interface ITokenBlacklist {
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export const TokenBlacklistSchema = new Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    createdAt: { type: Date, default: Date.now }
  },
  { collection: "tokenblacklists" }
);