import mongoose from "mongoose";
import { VideoWatchTrackingSchema, IVideoWatchTrackingDocument } from "../schemas/VideoWatchTracking.schema";

export type { IVideoWatchTrackingDocument } from "../schemas/VideoWatchTracking.schema";

export const VideoWatchTrackingModel = mongoose.model<IVideoWatchTrackingDocument>(
  "VideoWatchTracking",
  VideoWatchTrackingSchema
);

export const createVideoWatchTracking = async (data: {
  userId: string;
  videoId: string;
  dayNumber: number;
  videoDuration: number;
}) => {
  return await VideoWatchTrackingModel.create({
    ...data,
    watchProgress: 0,
    isCompleted: false,
    watchedDuration: 0,
    lastPosition: 0,
    maxWatchedPosition: 0,
    hasSkippedForward: false,
  });
};

export const findVideoWatchTracking = async (userId: string, dayNumber: number, videoId: string) => {
  return await VideoWatchTrackingModel.findOne({ userId, dayNumber, videoId });
};

export const findVideoWatchTrackingByDay = async (userId: string, dayNumber: number) => {
  return await VideoWatchTrackingModel.findOne({ userId, dayNumber });
};

export const findCompletedVideosByUser = async (userId: string, dayNumbers?: number[]) => {
  const query: any = { userId, isCompleted: true };
  if (dayNumbers && dayNumbers.length > 0) {
    query.dayNumber = { $in: dayNumbers };
  }
  return await VideoWatchTrackingModel.find(query);
};

export const updateVideoWatchProgress = async (
  userId: string,
  dayNumber: number,
  videoId: string,
  data: {
    watchProgress?: number;
    watchedDuration?: number;
    lastPosition?: number;
    maxWatchedPosition?: number;
    videoDuration?: number;
    hasSkippedForward?: boolean;
    isCompleted?: boolean;
    completedAt?: Date;
  }
) => {
  return await VideoWatchTrackingModel.findOneAndUpdate(
    { userId, dayNumber, videoId },
    { $set: data },
    { new: true, upsert: false }
  );
};