import {
  createVideoWatchTracking,
  findVideoWatchTracking,
  findVideoWatchTrackingByDay,
  findVideoWatchTrackingsByDay,
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

  // Detect seeking/skip-forward.
  // IMPORTANT: mobile apps often send progress updates every ~10s. A fixed "jump > 5s" check
  // will incorrectly mark normal playback as skipping. Instead, compare the position jump
  // against real time elapsed since the last update.
  const previousPosition = tracking.lastPosition || 0;
  const positionDiff = currentPosition - previousPosition;
  const now = new Date();
  const previousUpdatedAt = tracking.updatedAt ? new Date(tracking.updatedAt) : null;
  const secondsSinceLastUpdate = previousUpdatedAt
    ? Math.max(0, (now.getTime() - previousUpdatedAt.getTime()) / 1000)
    : 0;

  // Allow a small grace to account for player buffering / timer drift.
  const GRACE_SECONDS = 2;

  // A seek-forward is likely only if the user advanced significantly more than the time elapsed.
  // Example: if last update was 10s ago and position jumped 40s, that is a seek.
  const hasSkippedForward =
    positionDiff > 0 &&
    positionDiff > (secondsSinceLastUpdate + SKIP_THRESHOLD + GRACE_SECONDS);

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
    // keep updatedAt accurate (findOneAndUpdate does not run schema pre-save hooks)
    updatedAt: now,
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


export const getVideoWatchStatus = async (
  userId: string,
  dayNumber: number,
  videoId?: string
) => {
  if (videoId && String(videoId).trim() !== "") {
    const tracking = await findVideoWatchTracking(userId, dayNumber, String(videoId));
    return { tracking, trackings: tracking ? [tracking] : [] };
  }

  const trackings = await findVideoWatchTrackingsByDay(userId, dayNumber);
  const tracking = await findVideoWatchTrackingByDay(userId, dayNumber);
  return { tracking, trackings };
};

export const checkVideoCompletedForDay = async (userId: string, dayNumber: number): Promise<boolean> => {
  const extractDayNumberFromDescription = (description: unknown): number | null => {
    if (typeof description !== "string") return null;
    const d = description.trim();

    // Match formats like:
    // - "Day 1"
    // - "... Day 40."
    // - "Day 8a" / "Day 8b" (optional letter suffix)
    // Use a lookahead so "Day 1" doesn't match "Day 10".
    const m = /\bday\s*(\d+)(?:\s*[a-z])?(?=[^\w]|$)/i.exec(d);
    if (!m) return null;

    const parsed = Number(m[1]);
    if (!Number.isFinite(parsed)) return null;

    return parsed;
  };

  // Only require completion of the uploaded SESSION VIDEO(S) for this day.
  // Previously this checked *all* uploaded videos in the DB, which would incorrectly block users.
  const uploadedVideos = await SessionVideo.find({ status: "uploaded" });
  const daySessionVideos = uploadedVideos.filter((v: any) => {
    const title = typeof v?.title === "string" ? v.title.toLowerCase() : "";
    const isSessionVideo = title.includes("session video");
    if (!isSessionVideo) return false;

    const parsedDay = extractDayNumberFromDescription(v?.description);
    return parsedDay === dayNumber;
  });

  // If there are no session videos configured for this day, don't block the daily session submission.
  if (daySessionVideos.length === 0) {
    return true;
  }

  const completionChecks = await Promise.all(
    daySessionVideos.map(async (video: any) => {
      const videoId = String(video._id);
      const tracking = (await findVideoWatchTracking(userId, dayNumber, videoId)) as unknown as IVideoWatchTrackingDocument | null;
      return tracking?.isCompleted === true;
    })
  );

  return completionChecks.every((completed) => completed === true);
};

export const checkPreviousDayVideoCompleted = async (userId: string, currentDay: number): Promise<boolean> => {
  if (currentDay <= 1) {
    return true; // Day 1 doesn't require previous day completion
  }

  const previousDay = currentDay - 1;
  return await checkVideoCompletedForDay(userId, previousDay);
};

/**
 * Check if ALL previous days (from day 1 to currentDay - 1) have their videos completed
 * @param userId - User ID
 * @param currentDay - Current day number
 * @returns Object with { allCompleted: boolean, firstIncompleteDay: number | null }
 */
export const checkAllPreviousDaysVideosCompleted = async (
  userId: string,
  currentDay: number
): Promise<{ allCompleted: boolean; firstIncompleteDay: number | null }> => {
  if (currentDay <= 1) {
    return { allCompleted: true, firstIncompleteDay: null };
  }

  // Check all days from 1 to (currentDay - 1)
  for (let day = 1; day < currentDay; day++) {
    const isCompleted = await checkVideoCompletedForDay(userId, day);
    if (!isCompleted) {
      return { allCompleted: false, firstIncompleteDay: day };
    }
  }

  return { allCompleted: true, firstIncompleteDay: null };
};

/**
 * Check if any previous day has a submitted form but video not completed
 * @param userId - User ID
 * @param currentDay - Current day number
 * @param findDailySessionByUserAndDay - Function to find daily session by user and day
 * @returns Object with { hasIncompleteVideo: boolean, firstDayWithIncompleteVideo: number | null }
 */
export const checkPreviousDaysFormSubmittedButVideoNotWatched = async (
  userId: string,
  currentDay: number,
  findDailySessionByUserAndDay: (userId: string, day: number) => Promise<any>
): Promise<{ hasIncompleteVideo: boolean; firstDayWithIncompleteVideo: number | null }> => {
  if (currentDay <= 1) {
    return { hasIncompleteVideo: false, firstDayWithIncompleteVideo: null };
  }

  // Check all days from 1 to (currentDay - 1)
  for (let day = 1; day < currentDay; day++) {
    // Check if form was submitted for this day
    const session = await findDailySessionByUserAndDay(userId, day);
    
    if (session) {
      // Form was submitted, check if video is completed
      const videoCompleted = await checkVideoCompletedForDay(userId, day);
      
      if (!videoCompleted) {
        // Form submitted but video not watched
        return { hasIncompleteVideo: true, firstDayWithIncompleteVideo: day };
      }
    }
  }

  return { hasIncompleteVideo: false, firstDayWithIncompleteVideo: null };
};