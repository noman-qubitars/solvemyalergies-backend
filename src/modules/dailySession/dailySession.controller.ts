import { Response } from "express";
import { createDailySession, getDailySessions, getDailySessionByDay } from "./dailySession.service";
import { 
  checkVideoCompletedForDay, 
  checkPreviousDaysFormSubmittedButVideoNotWatched,
  checkPreviousDayVideoCompleted,
  checkAllPreviousDaysVideosCompleted 
} from "../videoWatchTracking/videoWatchTracking.service";
import { findDailySessionByUserAndDay } from "../../models/DailySession";
import { AuthRequest } from "../../middleware/auth";
import {
  sendUserIdNotFoundError,
  sendDayRequiredError,
  sendInvalidDayError,
  sendAnswersNotArrayError,
  sendIncorrectAnswersCountError,
  sendMissingQuestionsError,
  sendQuestionIdRequiredError,
  sendAnswerRequiredError,
  sendInvalidAnswerTypeError,
  sendUserIdRequiredError,
  sendPreviousDayVideoNotCompletedError,
  handleDailySessionError,
} from "./helpers/dailySession.controller.errors";
import {
  validateRequiredQuestions,
  validateAnswer,
  canSkipToDay,
} from "./helpers/dailySession.controller.utils";
import { UserAnswer } from "../../models/UserAnswer";

export const createSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return sendUserIdNotFoundError(res);
    }

    const { day, answers, feedback } = req.body;

    if (day === undefined || day === null) {
      return sendDayRequiredError(res);
    }

    // Validate day is between 1 and 42
    const dayNumber = Number(day);
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 42) {
      return sendInvalidDayError(res);
    }

    // Check if ALL previous days' videos were completed (except for day 1)
    // Priority: First check if any form was submitted without video watched (even if skip is allowed)
    if (dayNumber > 1) {
      // ALWAYS check if any previous day has form submitted but video not watched
      // This check takes priority over skip logic
      const { hasIncompleteVideo, firstDayWithIncompleteVideo } = await checkPreviousDaysFormSubmittedButVideoNotWatched(
        userId,
        dayNumber,
        findDailySessionByUserAndDay
      );
      
      if (hasIncompleteVideo && firstDayWithIncompleteVideo) {
        return sendPreviousDayVideoNotCompletedError(res, firstDayWithIncompleteVideo);
      }
      
      // If no form submitted with incomplete video, check skip logic
      let canSkip = false;
      try {
        const userAnswer = await UserAnswer.findOne({ userId });
        if (userAnswer && userAnswer.answers && userAnswer.answers.length > 0) {
          canSkip = canSkipToDay(userAnswer.answers, dayNumber);
        }
      } catch (error) {
        // If error fetching user answers, continue with normal check
      }

      // Only check all previous days' videos if user cannot skip
      if (!canSkip) {
        // Check ALL previous days have videos completed
        const { allCompleted, firstIncompleteDay } = await checkAllPreviousDaysVideosCompleted(userId, dayNumber);
        
        if (!allCompleted) {
          return sendPreviousDayVideoNotCompletedError(res, firstIncompleteDay || undefined);
        }
      }
    }

    if (!answers || !Array.isArray(answers)) {
      return sendAnswersNotArrayError(res);
    }

    if (answers.length !== 6) {
      return sendIncorrectAnswersCountError(res);
    }

    const questionsValidation = validateRequiredQuestions(answers);
    if (!questionsValidation.valid) {
      return sendMissingQuestionsError(res, questionsValidation.missing!);
    }

    for (const answer of answers) {
      const answerValidation = validateAnswer(answer);
      if (!answerValidation.valid) {
        if (answerValidation.error?.includes("questionId")) {
          return sendQuestionIdRequiredError(res);
        }
        if (answerValidation.error?.includes("required")) {
          return sendAnswerRequiredError(res, answer.questionId || "");
        }
        if (answerValidation.error?.includes("number")) {
          return sendInvalidAnswerTypeError(res, answer.questionId || "");
        }
      }
    }

    const result = await createDailySession({
      userId,
      day: dayNumber,
      answers,
      feedback,
    });

    res.status(201).json(result);
  } catch (error) {
    return handleDailySessionError(res, error, "Failed to create daily session");
  }
};

export const getSessions = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, day } = req.query;
    const isAdmin = req.userRole === "admin";

    let targetUserId: string | undefined;
    if (isAdmin) {
      targetUserId = userId as string | undefined;
    } else {
      targetUserId = req.userId || undefined;
    }

    if (!targetUserId) {
      return sendUserIdNotFoundError(res);
    }

    const params: { userId?: string; day?: number } = {};
    params.userId = targetUserId;

    // If day is provided, validate video completion checks
    let dayNum: number | undefined;
    if (day !== undefined && day !== null) {
      dayNum = Number(day);
      if (Number.isInteger(dayNum) && dayNum >= 1 && dayNum <= 42) {
        params.day = dayNum;
      } else {
        dayNum = undefined;
      }
    }

    const result = await getDailySessions(params);

    // Group sessions by day and add videoCompleted and canSubmit for each day
    // Always apply grouping for non-admin users
    if (!isAdmin && result.data && Array.isArray(result.data)) {
      const sessions = result.data as any[];
      
      // Get user answers once for skip checking (used for multiple days)
      let userAnswer: any = null;
      try {
        userAnswer = await UserAnswer.findOne({ userId: targetUserId });
      } catch (error) {
        // Error fetching user answers, continue without skip check
      }

      // Helper function to calculate canSubmit for a specific day
      const calculateCanSubmit = async (day: number, sessionExists: boolean): Promise<boolean> => {
        if (sessionExists) {
          // Session already exists, so canSubmit is true (already submitted)
          return true;
        }
        
        if (day === 1) {
          // Day 1 can always be submitted
          return true;
        }
        
        // Check if user can skip to this day
        let canSkip = false;
        if (userAnswer && userAnswer.answers && userAnswer.answers.length > 0) {
          canSkip = canSkipToDay(userAnswer.answers, day);
        }
        
        if (canSkip) {
          return true;
        }
        
        // Check if previous day's video is completed
        return await checkPreviousDayVideoCompleted(targetUserId, day);
      };

      // Group sessions by day
      const sessionsByDay = new Map<number, any[]>();
      sessions.forEach((session: any) => {
        const day = Number(session.day);
        if (!sessionsByDay.has(day)) {
          sessionsByDay.set(day, []);
        }
        sessionsByDay.get(day)!.push(session);
      });

      // Process each day to add videoCompleted and canSubmit
      const daysWithFlags = await Promise.all(
        Array.from(sessionsByDay.entries()).map(async ([day, daySessions]) => {
          // CHECK 1: videoCompleted for this specific day (independent check)
          const videoCompleted = await checkVideoCompletedForDay(targetUserId, day);
          
          // CHECK 2: canSubmit for this specific day (independent check)
          const canSubmit = await calculateCanSubmit(day, daySessions.length > 0);
          
          // Extract answers from the first session (if exists)
          const answers = daySessions.length > 0 ? (daySessions[0].answers || []) : [];
          
          return {
            day,
            videoCompleted,
            canSubmit,
            answers,
          };
        })
      );

      // If a specific day was requested but no session exists, add it with flags
      if (dayNum !== undefined) {
        const dayExists = daysWithFlags.some((d: any) => d.day === dayNum);
        
        if (!dayExists) {
          // No session for this day, check flags independently
          const videoCompleted = await checkVideoCompletedForDay(targetUserId, dayNum);
          const canSubmit = await calculateCanSubmit(dayNum, false); // No session exists
          
          // Add entry with flags for the requested day (empty answers array)
          daysWithFlags.push({
            day: dayNum,
            videoCompleted,
            canSubmit,
            answers: [],
          });
        }
      }

      // Sort by day number
      daysWithFlags.sort((a: any, b: any) => a.day - b.day);

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

export const getSessionByDate = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, dayNumber } = req.query;
    const isAdmin = req.userRole === "admin";

    let targetUserId: string;
    if (isAdmin) {
      if (!userId) {
        return sendUserIdRequiredError(res);
      }
      targetUserId = userId as string;
    } else {
      if (!req.userId) {
        return sendUserIdNotFoundError(res);
      }
      targetUserId = req.userId;
    }

    if (dayNumber === undefined || dayNumber === null) {
      return sendDayRequiredError(res);
    }

    const dayNum = Number(dayNumber);
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 42) {
      return sendInvalidDayError(res);
    }
    
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