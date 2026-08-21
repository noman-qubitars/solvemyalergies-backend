import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import {
  trackVideoWatch,
  getVideoWatchStatus,
  syncVideoWatchTracking,
  SyncProgressEvent,
} from "./videoWatchTracking.service";
import {
  sendUserIdNotFoundError,
  sendVideoIdRequiredError,
  sendDayNumberRequiredError,
  sendInvalidDayNumberError,
  sendPositionRequiredError,
  sendDurationRequiredError,
  sendEventsRequiredError,
  handleVideoWatchError,
} from "./helpers/videoWatchTracking.controller.errors";

export const getStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendUserIdNotFoundError(res);
    }

    const { dayNumber, videoId } = req.query;

    if (dayNumber === undefined || dayNumber === null) {
      return sendDayNumberRequiredError(res);
    }

    const dayNum = Number(dayNumber);
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 42) {
      return sendInvalidDayNumberError(res);
    }

    const result = await getVideoWatchStatus(
      userId,
      dayNum,
      typeof videoId === "string" ? videoId : undefined
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleVideoWatchError(res, error, "Failed to get video watch status");
  }
};

export const trackVideo = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendUserIdNotFoundError(res);
    }

    const { videoId, dayNumber, currentPosition, videoDuration } = req.body;

    if (!videoId) {
      return sendVideoIdRequiredError(res);
    }

    if (dayNumber === undefined || dayNumber === null) {
      return sendDayNumberRequiredError(res);
    }

    const dayNum = Number(dayNumber);
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 42) {
      return sendInvalidDayNumberError(res);
    }

    if (currentPosition === undefined || currentPosition === null) {
      return sendPositionRequiredError(res);
    }

    if (videoDuration === undefined || videoDuration === null) {
      return sendDurationRequiredError(res);
    }

    const result = await trackVideoWatch({
      userId,
      videoId,
      dayNumber: dayNum,
      currentPosition: Number(currentPosition),
      videoDuration: Number(videoDuration),
    });

    res.status(200).json({
      success: true,
      message: "Video watch progress updated",
      data: result,
    });
  } catch (error) {
    return handleVideoWatchError(res, error, "Failed to track video watch");
  }
};

// Accepts progress events collected while offline and replays them in order once the
// device is back online. Each event carries its own clientTimestamp so the server can
// reconstruct the correct chronology instead of trusting arrival order.
export const syncVideoTracking = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendUserIdNotFoundError(res);
    }

    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return sendEventsRequiredError(res);
    }

    const normalizedEvents: SyncProgressEvent[] = events.map((event: any) => ({
      videoId: event.videoId,
      dayNumber: Number(event.dayNumber),
      currentPosition: Number(event.currentPosition),
      videoDuration: Number(event.videoDuration),
      clientTimestamp: event.clientTimestamp,
      clientEventId: event.clientEventId,
    }));

    const results = await syncVideoWatchTracking(userId, normalizedEvents);

    res.status(200).json({
      success: true,
      message: "Offline video watch events synced",
      data: results,
    });
  } catch (error) {
    return handleVideoWatchError(res, error, "Failed to sync video watch events");
  }
};