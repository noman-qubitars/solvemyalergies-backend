import mongoose, { Document } from "mongoose";
import { FavoriteSchema, IFavorite } from "../schemas/Favorite.schema";

export interface IFavoriteDocument extends IFavorite, Document {}

export const FavoriteModel = mongoose.model<IFavoriteDocument>("Favorite", FavoriteSchema);

export { FavoriteModel as Favorite };
export { IFavorite, FavoriteSchema };

export const createFavorite = async (favoriteData: {
  userId: string;
  videoId: string;
}) => {
  return await FavoriteModel.create(favoriteData);
};

export const findFavoriteByUserAndVideo = async (userId: string, videoId: string) => {
  return await FavoriteModel.findOne({
    userId,
    videoId,
  });
};

export const findFavoritesByUserId = async (userId: string) => {
  return await FavoriteModel.find({ userId }).sort({ createdAt: -1 });
};

export const deleteFavorite = async (userId: string, videoId: string) => {
  return await FavoriteModel.findOneAndDelete({
    userId,
    videoId,
  });
};

export const deleteFavoriteById = async (favoriteId: string) => {
  return await FavoriteModel.findByIdAndDelete(favoriteId);
};