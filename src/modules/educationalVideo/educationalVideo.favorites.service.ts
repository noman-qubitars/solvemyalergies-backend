import {
  createFavorite,
  findFavoriteByUserAndVideo,
  findFavoritesByUserId,
} from "../../models/Favorite";
import { findEducationalVideoById } from "../../models/EducationalVideo";

export const addVideoToFavorites = async (userId: string, videoId: string) => {
  const video = await findEducationalVideoById(videoId);
  
  if (!video) {
    throw new Error("Educational video not found");
  }

  const existingFavorite = await findFavoriteByUserAndVideo(userId, videoId);
  
  if (existingFavorite) {
    throw new Error("Video is already in favorites");
  }

  const favorite = await createFavorite({
    userId,
    videoId,
  });

  return {
    success: true,
    message: "Video added to favorites successfully",
    data: favorite,
  };
};

export const getUserFavoriteVideos = async (
  userId: string,
  page?: number,
  pageSize?: number
) => {
  const favorites = await findFavoritesByUserId(userId);
  
  const videoIds = favorites.map((favorite) => favorite.videoId);
  
  const allVideos = await Promise.all(
    videoIds.map(async (videoId) => {
      return await findEducationalVideoById(videoId);
    })
  );

  const validVideos = allVideos.filter((video) => video !== null);
  const totalVideos = validVideos.length;

  const defaultPageSize = 5;
  const effectivePageSize = pageSize || defaultPageSize;
  const effectivePage = page || 1;

  const skip = (effectivePage - 1) * effectivePageSize;
  const paginatedVideos = validVideos.slice(skip, skip + effectivePageSize);

  return {
    success: true,
    data: paginatedVideos,
    totalVideos,
    currentPage: effectivePage,
    pageSize: effectivePageSize,
    totalPages: Math.ceil(totalVideos / effectivePageSize),
  };
};