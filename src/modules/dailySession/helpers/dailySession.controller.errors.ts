import { Response } from "express";

export const sendUserIdNotFoundError = (res: Response) => {
  return res.status(401).json({
    success: false,
    message: "User ID not found in token",
  });
};

export const sendDateRequiredError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Date is required",
  });
};

export const sendInvalidDateError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Date must be a valid date string in format YYYY-MM-DD",
  });
};

export const sendDateNotTodayError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "You can only submit a session for today's date",
  });
};

export const sendAnswersNotArrayError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Answers must be an array",
  });
};

export const sendIncorrectAnswersCountError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "All 6 questions (question_1 to question_6) are required",
  });
};

export const sendMissingQuestionsError = (res: Response, missingQuestions: string[]) => {
  return res.status(400).json({
    success: false,
    message: `Missing required questions: ${missingQuestions.join(", ")}`,
  });
};

export const sendQuestionIdRequiredError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Each answer must have a questionId",
  });
};

export const sendAnswerRequiredError = (res: Response, questionId: string) => {
  return res.status(400).json({
    success: false,
    message: `Answer for ${questionId} is required`,
  });
};

export const sendInvalidAnswerTypeError = (res: Response, questionId: string) => {
  return res.status(400).json({
    success: false,
    message: `${questionId} must be a number (rating type)`,
  });
};

export const sendUserIdRequiredError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "User ID is required",
  });
};

export const sendSessionNotFoundError = (res: Response) => {
  return res.status(404).json({
    success: false,
    message: "Session not found for this date",
  });
};

export const handleDailySessionError = (res: Response, error: unknown, defaultMessage: string) => {
  const message = error instanceof Error ? error.message : defaultMessage;
  return res.status(400).json({
    success: false,
    message: message,
  });
};