import { Response } from "express";
import { createDailySession, getDailySessions, getDailySessionByDate } from "./dailySession.service";
import { AuthRequest } from "../../middleware/auth";
import {
  sendUserIdNotFoundError,
  sendDateRequiredError,
  sendInvalidDateError,
  sendDateNotTodayError,
  sendAnswersNotArrayError,
  sendIncorrectAnswersCountError,
  sendMissingQuestionsError,
  sendQuestionIdRequiredError,
  sendAnswerRequiredError,
  sendInvalidAnswerTypeError,
  sendUserIdRequiredError,
  sendSessionNotFoundError,
  handleDailySessionError,
} from "./helpers/dailySession.controller.errors";
import {
  isValidDate,
  isTodayDate,
  validateRequiredQuestions,
  validateAnswer,
  buildGetSessionsParams,
} from "./helpers/dailySession.controller.utils";

export const createSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return sendUserIdNotFoundError(res);
    }

    const { date, answers, feedback } = req.body;

    if (!date) {
      return sendDateRequiredError(res);
    }

    const dateObj = new Date(date);
    if (!isValidDate(dateObj)) {
      return sendInvalidDateError(res);
    }

    if (!isTodayDate(dateObj)) {
      return sendDateNotTodayError(res);
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
      date: dateObj,
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
    const { userId, startDate, endDate } = req.query;
    const isAdmin = req.userRole === "admin";

    const params = buildGetSessionsParams(
      userId as string | undefined,
      startDate as string | undefined,
      endDate as string | undefined,
      isAdmin,
      req.userId || undefined
    );

    const result = await getDailySessions(params);

    res.status(200).json(result);
  } catch (error) {
    return handleDailySessionError(res, error, "Failed to fetch daily sessions");
  }
};

export const getSessionByDate = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, date } = req.query;
    const isAdmin = req.userRole === "admin";

    if (!date) {
      return sendDateRequiredError(res);
    }

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

    const session = await getDailySessionByDate(targetUserId, new Date(date as string));

    if (!session) {
      return sendSessionNotFoundError(res);
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    return handleDailySessionError(res, error, "Failed to fetch daily session");
  }
};