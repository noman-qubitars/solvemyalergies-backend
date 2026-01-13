import { Response } from "express";
import mongoose from "mongoose";
import { getQuestionNumber, validateSequentialQuestion } from "./quiz.controller.utils";

export const validateUserId = (userId: string | undefined, res: Response): boolean => {
  if (!userId) {
    res.status(401).json({
      success: false,
      message: "User ID not found in token",
    });
    return false;
  }
  return true;
};

export const validateObjectId = (id: string | undefined, res: Response): boolean => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({
      success: false,
      message: "Incorrect id",
    });
    return false;
  }
  return true;
};

export const validateUserOwnership = (
  userAnswer: any,
  userId: string,
  res: Response
): boolean => {
  if (userAnswer.userId !== userId) {
    res.status(403).json({
      success: false,
      message: "You can only update your own answers",
    });
    return false;
  }
  return true;
};

export const validateFirstQuestion = (questionId: string, res: Response): boolean => {
  const currentQuestionNum = getQuestionNumber(questionId);
  if (currentQuestionNum !== null && currentQuestionNum !== 1) {
    res.status(400).json({
      success: false,
      message: `You must answer question_${currentQuestionNum - 1} first before answering ${questionId}`,
    });
    return false;
  }
  return true;
};

export const validateQuestionSequence = (
  questionId: string,
  existingAnswers: Array<{ questionId: string }>,
  res: Response
): boolean => {
  const validation = validateSequentialQuestion(questionId, existingAnswers);
  if (!validation.valid && validation.missingQuestion) {
    res.status(400).json({
      success: false,
      message: `You must answer question_${validation.missingQuestion} first before answering ${questionId}`,
    });
    return false;
  }
  return true;
};

export const validateAnswerNotExists = (
  existingAnswerIndex: number,
  res: Response
): boolean => {
  if (existingAnswerIndex !== -1) {
    res.status(400).json({
      success: false,
      message: "You already save answer for this question.",
    });
    return false;
  }
  return true;
};