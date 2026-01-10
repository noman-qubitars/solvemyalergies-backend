import { Response } from "express";
import { createDailySession, getDailySessions, getDailySessionByDay } from "./dailySession.service";
import { checkVideoCompletedForDay } from "../videoWatchTracking/videoWatchTracking.service";
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
import { checkPreviousDayVideoCompleted } from "../videoWatchTracking/videoWatchTracking.service";
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

    // Check if previous day's video was completed (except for day 1)
    // Allow skipping if user has symptoms that map to this day
    if (dayNumber > 1) {
      // Check if user can skip to this day based on questionnaire answers
      let canSkip = false;
      try {
        const userAnswer = await UserAnswer.findOne({ userId });
        if (userAnswer && userAnswer.answers && userAnswer.answers.length > 0) {
          canSkip = canSkipToDay(userAnswer.answers, dayNumber);
          console.log(`[Skip Check] User ${userId}, Day ${dayNumber}, CanSkip: ${canSkip}`, {
            answers: userAnswer.answers.map(a => ({ questionId: a.questionId, selectedOption: a.selectedOption }))
          });
        } else {
          console.log(`[Skip Check] User ${userId} has no answers or empty answers array`);
        }
      } catch (error) {
        // If error fetching user answers, continue with normal check
        console.error("Error checking user answers for skip:", error);
      }

      // Only check previous day if user cannot skip
      if (!canSkip) {
        const previousDayCompleted = await checkPreviousDayVideoCompleted(userId, dayNumber);
        if (!previousDayCompleted) {
          return sendPreviousDayVideoNotCompletedError(res);
        }
      } else {
        console.log(`[Skip Check] User ${userId} allowed to skip to day ${dayNumber} based on symptoms`);
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

    // Validate video completion when day is provided (for non-admin users)
    if (dayNum !== undefined && !isAdmin) {
      // Check if video is completed for this day (required to access form)
      const videoCompleted = await checkVideoCompletedForDay(targetUserId, dayNum);
      
      if (!videoCompleted) {
        return res.status(200).json({
          success: true,
          data: [],
          videoCompleted: false,
          canSubmit: false,
          message: "Please complete the video for this day before accessing the session form.",
        });
      }

      // Check if previous day's video is completed (required to submit for day > 1)
      // Allow skipping if user has symptoms that map to this day
      if (dayNum > 1) {
        // Check if user can skip to this day based on questionnaire answers
        let canSkip = false;
        try {
          const userAnswer = await UserAnswer.findOne({ userId: targetUserId });
          if (userAnswer && userAnswer.answers && userAnswer.answers.length > 0) {
            canSkip = canSkipToDay(userAnswer.answers, dayNum);
          }
        } catch (error) {
          // If error fetching user answers, continue with normal check
          console.error("Error checking user answers for skip:", error);
        }

        // Only check previous day if user cannot skip
        if (!canSkip) {
          const previousDayCompleted = await checkPreviousDayVideoCompleted(targetUserId, dayNum);
          if (!previousDayCompleted) {
            return res.status(200).json({
              success: true,
              data: [],
              videoCompleted: true,
              canSubmit: false,
              message: "Please complete the previous day's session video before starting a new session. Videos must be watched completely without skipping forward.",
            });
          }
        }
      }
    }

    const result = await getDailySessions(params);

    // Calculate canSubmit flag for non-admin users
    let canSubmit: boolean | undefined;
    let videoCompleted: boolean | undefined;

    if (!isAdmin) {
      const sessions = result.data as any[];
      
      // If day is provided, always check video completion status
      if (dayNum !== undefined) {
        // Always check video completion for the provided day
        videoCompleted = await checkVideoCompletedForDay(targetUserId, dayNum);
        
        // Check if session exists for this day (form already submitted)
        // Compare as numbers to ensure type matching
        const sessionExists = sessions.some((s: any) => Number(s.day) === dayNum);
        
        if (sessionExists) {
          // If session exists, user has already submitted the form, so canSubmit is true
          canSubmit = true;
        } else {
          // No session exists, check if they can submit (video completion checks)
          canSubmit = videoCompleted;
          
          if (dayNum > 1 && canSubmit) {
            // Check if user can skip to this day based on questionnaire answers
            let canSkip = false;
            try {
              const userAnswer = await UserAnswer.findOne({ userId: targetUserId });
              if (userAnswer && userAnswer.answers && userAnswer.answers.length > 0) {
                canSkip = canSkipToDay(userAnswer.answers, dayNum);
              }
            } catch (error) {
              // If error fetching user answers, continue with normal check
              console.error("Error checking user answers for skip:", error);
            }

            // Only check previous day if user cannot skip
            if (!canSkip) {
              canSubmit = await checkPreviousDayVideoCompleted(targetUserId, dayNum);
            }
          }
        }
      } else {
        // If no day provided, check if user has any completed sessions
        // If they have sessions, canSubmit should be true (they can proceed)
        if (sessions.length > 0) {
          // User has completed at least one session, so canSubmit is true
          canSubmit = true;
          
          // Check video completion for the first day in the sessions (or most recent)
          // Get the day from the first session or the day with the most recent session
          const firstSessionDay = sessions[0]?.day ? Number(sessions[0].day) : undefined;
          if (firstSessionDay !== undefined) {
            videoCompleted = await checkVideoCompletedForDay(targetUserId, firstSessionDay);
          }
          
          // Also check if they can submit the next day
          const maxDay = Math.max(...sessions.map((s: any) => s.day || 0));
          const nextDay = maxDay + 1;
          
          if (nextDay <= 42) {
            // Check if next day's video is completed (for submitting next day)
            const nextDayVideoCompleted = await checkVideoCompletedForDay(targetUserId, nextDay);
            const currentDayVideoCompleted = await checkVideoCompletedForDay(targetUserId, maxDay);
            
            // canSubmit remains true if they have sessions, but we can add nextDayCanSubmit if needed
            // For now, canSubmit = true means they can proceed with their completed days
          }
        } else {
          // No sessions yet, check if they can submit day 1
          const day1VideoCompleted = await checkVideoCompletedForDay(targetUserId, 1);
          canSubmit = day1VideoCompleted;
          videoCompleted = day1VideoCompleted;
        }
      }
    }

    // Build response
    const response: any = {
      success: result.success,
      data: result.data,
    };

    if (!isAdmin) {
      // Always include videoCompleted when day is provided, otherwise include if checked
      if (dayNum !== undefined) {
        // When day is provided, always include videoCompleted (even if false)
        response.videoCompleted = videoCompleted !== undefined ? videoCompleted : false;
      } else if (videoCompleted !== undefined) {
        // When no day provided but videoCompleted was checked, include it
        response.videoCompleted = videoCompleted;
      }
      if (canSubmit !== undefined) {
        response.canSubmit = canSubmit;
      }
    }

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