import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import {
  trackVideoWatch,
  getVideoWatchStatus,
} from "./videoWatchTracking.service";
import {
  sendUserIdNotFoundError,
  sendVideoIdRequiredError,
  sendDayNumberRequiredError,
  sendInvalidDayNumberError,
  sendPositionRequiredError,
  sendDurationRequiredError,
  handleVideoWatchError,
} from "./helpers/videoWatchTracking.controller.errors";

export const getStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendUserIdNotFoundError(res);
    }

    const { dayNumber } = req.query;

    if (dayNumber === undefined || dayNumber === null) {
      return sendDayNumberRequiredError(res);
    }

    const dayNum = Number(dayNumber);
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 42) {
      return sendInvalidDayNumberError(res);
    }

    const result = await getVideoWatchStatus(userId, dayNum);

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