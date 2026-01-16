import { Response } from "express";
import { createDailySession, getDailySessions, getDailySessionByDay } from "./dailySession.service";
import { checkVideoCompletedForDay } from "../videoWatchTracking/videoWatchTracking.service";
import { AuthRequest } from "../../middleware/auth";
import {
  sendUserIdNotFoundError,
  sendDayRequiredError,
  sendInvalidDayError,
  sendUserIdRequiredError,
  handleDailySessionError,
} from "./helpers/dailySession.controller.errors";
import { validateDay, validateAnswers, getTargetUserId } from "./helpers/requestValidation.helpers";
import { validateDayAccess } from "./helpers/videoCompletion.helpers";
import { processSessionsByDay, addDayIfMissing } from "./helpers/sessionProcessing.helpers";
import { UserAnswer } from "../../models/UserAnswer";

// ============================================================================
// CREATE SESSION
// ============================================================================

export const createSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return sendUserIdNotFoundError(res);
    }

    const { day, answers, feedback } = req.body;

    // Validate day
    const dayValidation = validateDay(day);
    if (!dayValidation.valid) {
      if (day === undefined || day === null) {
        return sendDayRequiredError(res);
      }
      return sendInvalidDayError(res);
    }

    const dayNumber = dayValidation.dayNumber!;

    // Validate day access (video completion checks)
    const accessValidation = await validateDayAccess(userId, dayNumber);
    if (!accessValidation.canProceed) {
      return res.status(403).json({
        success: false,
        message: accessValidation.errorDay
          ? `Please complete day ${accessValidation.errorDay}'s session video before starting a new session. All previous days' videos must be watched completely.`
          : "Please complete all previous days' session videos before starting a new session. Videos must be watched completely without skipping forward.",
      });
    }

    // Validate answers
    const answersValidation = validateAnswers(answers, res);
    if (!answersValidation.valid) {
      return; // Error already sent
    }

    const result = await createDailySession({
      userId,
      day: dayNumber,
      answers: answersValidation.answers!,
      feedback,
    });

    res.status(201).json(result);
  } catch (error) {
    return handleDailySessionError(res, error, "Failed to create daily session");
  }
};

// ============================================================================
// GET SESSIONS
// ============================================================================

export const getSessions = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, day } = req.query;
    const isAdmin = req.userRole === "admin";

    const targetUserId = getTargetUserId(isAdmin, req.userId, userId as string | undefined);

    if (!targetUserId) {
      return sendUserIdNotFoundError(res);
    }

    const params: { userId?: string; day?: number } = {
      userId: targetUserId,
    };

    // If day is provided, validate it
    let dayNum: number | undefined;
    if (day !== undefined && day !== null) {
      const dayValidation = validateDay(day);
      if (dayValidation.valid) {
        dayNum = dayValidation.dayNumber;
        params.day = dayNum;
      }
    }

    const result = await getDailySessions(params);

    // Group sessions by day and add videoCompleted and canSubmit for each day
    // Always apply grouping for non-admin users
    if (!isAdmin && result.data && Array.isArray(result.data)) {
      const sessions = result.data as any[];
      
      // Get user answers once for skip checking
      let userAnswer: any = null;
      try {
        userAnswer = await UserAnswer.findOne({ userId: targetUserId });
      } catch (error) {
        // Error fetching user answers, continue without skip check
      }

      // Process sessions by day
      let daysWithFlags = await processSessionsByDay(sessions, targetUserId);

      // If a specific day was requested but no session exists, add it with flags
      if (dayNum !== undefined) {
        daysWithFlags = await addDayIfMissing(daysWithFlags, dayNum, targetUserId, userAnswer);
      }

      result.data = daysWithFlags;
    }

    // Build response
    const response: any = {
      success: result.success,
      data: result.data,
    };

    res.status(200).json(response);
  } catch (error) {
    return handleDailySessionError(res, error, "Failed to fetch daily sessions");
  }
};

// ============================================================================
// GET SESSION BY DATE
// ============================================================================

export const getSessionByDate = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, dayNumber } = req.query;
    const isAdmin = req.userRole === "admin";

    const targetUserId = getTargetUserId(isAdmin, req.userId, userId as string | undefined);

    if (!targetUserId) {
      if (isAdmin) {
        return sendUserIdRequiredError(res);
      } else {
        return sendUserIdNotFoundError(res);
      }
    }

    // Validate day
    if (dayNumber === undefined || dayNumber === null) {
      return sendDayRequiredError(res);
    }

    const dayValidation = validateDay(dayNumber);
    if (!dayValidation.valid) {
      return sendInvalidDayError(res);
    }

    const dayNum = dayValidation.dayNumber!;
    
    // Check if video is completed for this day
    const videoCompleted = await checkVideoCompletedForDay(targetUserId, dayNum);
    
    if (!videoCompleted) {
      return res.status(200).json({
        success: true,
        data: null,
        videoCompleted: false,
        message: "Please complete the video for this day before accessing the session form.",
      });
    }
    
    const session = await getDailySessionByDay(targetUserId, dayNum);

    if (!session) {
      return res.status(200).json({
        success: true,
        data: null,
        videoCompleted: true,
        message: "No session found for this day.",
      });
    }

    res.status(200).json({
      success: true,
      data: session,
      videoCompleted: true,
    });
  } catch (error) {
    return handleDailySessionError(res, error, "Failed to fetch daily session");
  }
};