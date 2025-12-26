import {
  createEducationalVideoModel,
  findEducationalVideoById,
  findEducationalVideos,
  countEducationalVideos,
  updateEducationalVideoById,
  deleteEducationalVideoById,
} from "../../models/EducationalVideo";
import { findFavoriteByUserAndVideo } from "../../models/Favorite";

export const createEducationalVideo = async (data: {
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: "uploaded" | "draft";
}) => {
  return await createEducationalVideoModel(data);
};

export const getAllEducationalVideos = async (
  status?: "uploaded" | "draft",
  page?: number,
  pageSize?: number,
  userId?: string
) => {
  const query = status ? { status } : {};
  
  const totalVideos = await countEducationalVideos(query);

  const defaultPageSize = 10;
  const effectivePageSize = pageSize || defaultPageSize;
  const effectivePage = page || 1;

  const skip = (effectivePage - 1) * effectivePageSize;
  const videos = await findEducationalVideos(query, skip, effectivePageSize);

  let videosWithFavorites;
  
  if (userId) {
    videosWithFavorites = await Promise.all(
      videos.map(async (video: any) => {
        const videoObj = video.toObject ? video.toObject() : video;
        const videoId = videoObj._id ? videoObj._id.toString() : String(videoObj._id);
        const favorite = await findFavoriteByUserAndVideo(userId, videoId);
        return {
          ...videoObj,
          isFavorite: !!favorite,
        };
      })
    );
  } else {
    videosWithFavorites = videos.map((video: any) => {
      const videoObj = video.toObject ? video.toObject() : video;
      return {
        ...videoObj,
        isFavorite: false,
      };
    });
  }

  return {
    videos: videosWithFavorites,
    totalVideos,
    currentPage: effectivePage,
    pageSize: effectivePageSize,
    totalPages: Math.ceil(totalVideos / effectivePageSize),
  };
};

export const getEducationalVideoById = async (id: string) => {
  return await findEducationalVideoById(id);
};

export const updateEducationalVideo = async (
  id: string,
  data: {
    title?: string;
    description?: string;
    status?: "uploaded" | "draft";
    videoUrl?: string;
    thumbnailUrl?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }
) => {
  return await updateEducationalVideoById(id, data);
};

export const deleteEducationalVideo = async (id: string) => {
  return await deleteEducationalVideoById(id);
};