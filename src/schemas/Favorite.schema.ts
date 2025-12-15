import { Schema } from "mongoose";

export interface IFavorite {
  userId: string;
  videoId: string;
  createdAt: Date;
}

export const FavoriteSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    videoId: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "favorites" }
);

FavoriteSchema.index({ userId: 1, videoId: 1 }, { unique: true });