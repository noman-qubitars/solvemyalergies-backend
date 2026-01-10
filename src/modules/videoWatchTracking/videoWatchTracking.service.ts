import {
  createVideoWatchTracking,
  findVideoWatchTracking,
  findVideoWatchTrackingByDay,
  updateVideoWatchProgress,
  IVideoWatchTrackingDocument,
} from "../../models/VideoWatchTracking";
import { SessionVideo } from "../../models/SessionVideo";

const SKIP_THRESHOLD = 5; // If user jumps more than 5 seconds forward, it's considered skipping
const COMPLETION_THRESHOLD = 95; // Video is considered complete if watched >= 95%

export interface UpdateProgressData {
  userId: string;
  videoId: string;
  dayNumber: number;
  currentPosition: number; 
  videoDuration: number; 
}

export const trackVideoWatch = async (data: UpdateProgressData) => {
  const { userId, videoId, dayNumber, currentPosition, videoDuration } = data;

  // Verify video exists
  const video = await SessionVideo.findById(videoId);
  if (!video) {
    throw new Error("Video not found");
  }

  // Check if tracking exists, if not create it
  let tracking = (await findVideoWatchTracking(userId, dayNumber, videoId)) as unknown as IVideoWatchTrackingDocument | null;
  
  if (!tracking) {
    // Create new tracking
    tracking = (await createVideoWatchTracking({
      userId,
      videoId,
      dayNumber,
      videoDuration,
    })) as unknown as IVideoWatchTrackingDocument;
  }

  if (!tracking) {
    throw new Error("Failed to create or retrieve video tracking");
  }

  // Update video duration if not set or if it changed (use the larger/more accurate value)
  let videoDurationValue = tracking.videoDuration || videoDuration;
  const durationChanged = tracking.videoDuration && Math.abs(tracking.videoDuration - videoDuration) > 0.5;
  const shouldUpdateDuration = !tracking.videoDuration || (durationChanged && videoDuration > tracking.videoDuration);
  
  if (shouldUpdateDuration && videoDuration > 0) {
    videoDurationValue = videoDuration;
    await updateVideoWatchProgress(userId, dayNumber, videoId, { videoDuration });
    tracking.videoDuration = videoDuration;
    // Also update SessionVideo model with duration for future queries
    await SessionVideo.findByIdAndUpdate(videoId, { videoDuration }, { new: false });
  } else if (tracking.videoDuration && videoDuration > 0) {
    // Ensure SessionVideo also has the duration
    const sessionVideo = await SessionVideo.findById(videoId);
    if (sessionVideo && !sessionVideo.videoDuration) {
      await SessionVideo.findByIdAndUpdate(videoId, { videoDuration: tracking.videoDuration }, { new: false });
    }
    videoDurationValue = tracking.videoDuration;
  }

  // Allow forward skipping (previewing) - don't block it
  const maxWatched = (tracking.maxWatchedPosition || 0);
  const newMaxWatchedPosition = Math.max(maxWatched, currentPosition);

  // Check if user skipped forward (jumped more than threshold)
  const positionDiff = currentPosition - (tracking.lastPosition || 0);
  const hasSkippedForward = positionDiff > SKIP_THRESHOLD && currentPosition > (tracking.lastPosition || 0);

  // If user goes back to beginning (position < 10 seconds) after skipping, reset skip flag
  // This allows them to preview and then watch from start
  let shouldResetSkipFlag = false;
  if (currentPosition < 10 && tracking.hasSkippedForward) {
    // User went back to beginning after skipping - allow reset
    shouldResetSkipFlag = true;
  }

  // Calculate watch progress percentage based on max watched position and updated duration
  const watchProgress = videoDurationValue > 0 
    ? Math.min(100, (newMaxWatchedPosition / videoDurationValue) * 100) 
    : 0;

  // Check if video is completed
  // If user went back to beginning and watched everything, allow completion
  // Also allow completion if they watched ≥95% and are near the end (within 1 second of duration)
  const effectiveHasSkippedForward = shouldResetSkipFlag ? false : (tracking.hasSkippedForward || hasSkippedForward);
  const isNearEnd = videoDurationValue > 0 && (videoDurationValue - newMaxWatchedPosition) <= 1;
  const isCompleted = watchProgress >= COMPLETION_THRESHOLD && (!effectiveHasSkippedForward || isNearEnd);

  const updateData: any = {
    watchProgress,
    watchedDuration: newMaxWatchedPosition,
    lastPosition: currentPosition,
    maxWatchedPosition: newMaxWatchedPosition,
    videoDuration: videoDurationValue,
    hasSkippedForward: effectiveHasSkippedForward,
    isCompleted: isCompleted || tracking.isCompleted, // Use new completion status or keep existing
  };

  if (isCompleted && !tracking.isCompleted) {
    updateData.completedAt = new Date();
  }

  const updated = await updateVideoWatchProgress(userId, dayNumber, videoId, updateData);

  if (!updated) {
    throw new Error("Failed to update video watch progress");
  }

  return {
    ...updated.toObject(),
    canProceed: true,
    maxWatchedPosition: newMaxWatchedPosition,
  };
};


export const getVideoWatchStatus = async (userId: string, dayNumber: number) => {
  const tracking = await findVideoWatchTrackingByDay(userId, dayNumber);
  return tracking;
};

export const checkVideoCompletedForDay = async (userId: string, dayNumber: number): Promise<boolean> => {
  // Get all uploaded session videos
  const allVideos = await SessionVideo.find({ status: "uploaded" });
  
  if (allVideos.length === 0) {
    return false; // No videos to watch
  }
  
  // Check if user has completed ALL videos for this day
  const videoIds = allVideos.map(video => video._id.toString());
  
  // Get all tracking records for this user, day, and these videos
  const completionChecks = await Promise.all(
    videoIds.map(async (videoId) => {
      const tracking = (await findVideoWatchTracking(userId, dayNumber, videoId)) as unknown as IVideoWatchTrackingDocument | null;
      return tracking?.isCompleted === true;
    })
  );
  
  // Return true only if ALL videos are completed
  return completionChecks.every(completed => completed === true);
};

export const checkPreviousDayVideoCompleted = async (userId: string, currentDay: number): Promise<boolean> => {
  if (currentDay <= 1) {
    return true; // Day 1 doesn't require previous day completion
  }

  const previousDay = currentDay - 1;
  return await checkVideoCompletedForDay(userId, previousDay);
};