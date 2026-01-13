import { Response } from "express";

export const sendUserIdNotFoundError = (res: Response) => {
  return res.status(401).json({
    success: false,
    message: "User ID not found in token",
  });
};

export const sendDayRequiredError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Day is required",
  });
};

export const sendInvalidDayError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Day must be a number between 1 and 42",
  });
};

export const sendAnswersNotArrayError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Answers must be an array",
  });
};

// Keep old function names for backward compatibility with getSessionByDate
export const sendDateRequiredError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Date is required",
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

export const sendPreviousDayVideoNotCompletedError = (res: Response, incompleteDay?: number) => {
  const message = incompleteDay
    ? `Please complete day ${incompleteDay}'s session video before starting a new session. All previous days' videos must be watched completely.`
    : "Please complete all previous days' session videos before starting a new session. Videos must be watched completely without skipping forward.";
  
  return res.status(403).json({
    success: false,
    message,
  });
};

export const handleDailySessionError = (res: Response, error: unknown, defaultMessage: string) => {
  const message = error instanceof Error ? error.message : defaultMessage;
  return res.status(400).json({
    success: false,
    message: message,
  });
};