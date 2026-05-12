import {
  validateRequiredQuestions,
  validateAnswer,
  getRequiredQuestions,
  getRatingQuestions,
} from "./dailySession.controller.utils";
import {
  sendDayRequiredError,
  sendInvalidDayError,
  sendAnswersNotArrayError,
  sendIncorrectAnswersCountError,
  sendMissingQuestionsError,
  sendQuestionIdRequiredError,
  sendAnswerRequiredError,
  sendInvalidAnswerTypeError,
} from "./dailySession.controller.errors";
import { Response } from "express";

/**
 * Validates day parameter
 */
export const validateDay = (day: any): { valid: boolean; dayNumber?: number; error?: Response } => {
  if (day === undefined || day === null) {
    return { valid: false };
  }

  const dayNumber = Number(day);
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 42) {
    return { valid: false };
  }

  return { valid: true, dayNumber };
};

/**
 * Validates answers array structure and content based on the user's symptom count.
 * Users who selected fewer symptoms during onboarding will have fewer required rating questions.
 */
export const validateAnswers = (
  answers: any,
  res: Response,
  symptomCount: number = 3
): { valid: boolean; answers?: any[] } => {
  if (!answers || !Array.isArray(answers)) {
    sendAnswersNotArrayError(res);
    return { valid: false };
  }

  const requiredQuestions = getRequiredQuestions(symptomCount);
  const expectedCount = requiredQuestions.length;

  if (answers.length < expectedCount) {
    sendIncorrectAnswersCountError(res, expectedCount, requiredQuestions);
    return { valid: false };
  }

  if (answers.length > 6) {
    sendIncorrectAnswersCountError(res, expectedCount, requiredQuestions);
    return { valid: false };
  }

  const questionsValidation = validateRequiredQuestions(answers, requiredQuestions);
  if (!questionsValidation.valid) {
    sendMissingQuestionsError(res, questionsValidation.missing!);
    return { valid: false };
  }

  const ratingQuestions = getRatingQuestions(symptomCount);
  for (const answer of answers) {
    const answerValidation = validateAnswer(answer, ratingQuestions);
    if (!answerValidation.valid) {
      if (answerValidation.error?.includes("questionId")) {
        sendQuestionIdRequiredError(res);
        return { valid: false };
      }
      if (answerValidation.error?.includes("required")) {
        sendAnswerRequiredError(res, answer.questionId || "");
        return { valid: false };
      }
      if (answerValidation.error?.includes("number")) {
        sendInvalidAnswerTypeError(res, answer.questionId || "");
        return { valid: false };
      }
    }
  }

  return { valid: true, answers };
};

/**
 * Gets target user ID based on admin status
 */
export const getTargetUserId = (
  isAdmin: boolean,
  requestUserId: string | undefined,
  queryUserId?: string
): string | undefined => {
  if (isAdmin) {
    return queryUserId as string | undefined;
  } else {
    return requestUserId;
  }
};