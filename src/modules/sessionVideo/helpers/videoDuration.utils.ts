import { VideoWatchTrackingModel } from "../../../models/VideoWatchTracking";
import { SessionVideo } from "../../../models/SessionVideo";
import { formatDuration } from "./sessionVideo.controller.utils";

/**
 * Gets video duration from SessionVideo model or VideoWatchTracking
 */
export const getVideoDuration = async (videoId: string, videoObj?: any): Promise<number | undefined> => {
  // First check if videoDuration is stored in SessionVideo model
  let videoDuration = videoObj?.videoDuration;

  // If not, get videoDuration from VideoWatchTracking
  if (!videoDuration) {
    const tracking = await VideoWatchTrackingModel.findOne({ videoId })
      .select('videoDuration')
      .sort({ createdAt: -1 })
      .lean();

    if (tracking?.videoDuration) {
      videoDuration = tracking.videoDuration;
      // Update SessionVideo with duration for future queries
      await SessionVideo.findByIdAndUpdate(videoId, { videoDuration: tracking.videoDuration });
    }
  }

  return videoDuration;
};

/**
 * Adds formatted duration to a single video object
 */
export const addDurationToVideo = async (video: any) => {
  const videoObj = video.toObject ? video.toObject() : video;
  const durationInSeconds = await getVideoDuration(video._id.toString(), videoObj);

  return {
    ...videoObj,
    videoDuration: formatDuration(durationInSeconds),
  };
};

/**
 * Adds formatted duration to multiple videos
 */
export const addDurationToVideos = async (videos: any[]) => {
  return await Promise.all(videos.map(video => addDurationToVideo(video)));
};