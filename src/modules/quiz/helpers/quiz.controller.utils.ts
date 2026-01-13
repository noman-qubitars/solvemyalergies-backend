import mongoose from "mongoose";
import { Question } from "../../../models/Question";
import { AnswerItem } from "../../../models/UserAnswer";
import { assignSessionsFromAnswers } from "../../../services/sessionAssignmentService";

export const getQuestionNumber = (questionId: string): number | null => {
  const match = questionId.match(/question_(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

export const validateSequentialQuestion = (
  questionId: string,
  existingAnswers: Array<{ questionId: string }>
): { valid: boolean; missingQuestion?: number } => {
  const currentQuestionNum = getQuestionNumber(questionId);
  if (currentQuestionNum === null) {
    return { valid: true };
  }

  if (currentQuestionNum <= 2) {
    return { valid: true };
  }

  const answeredQuestionNums = existingAnswers
    .map((ans) => getQuestionNumber(ans.questionId))
    .filter((num): num is number => num !== null);

  if (!answeredQuestionNums.includes(2)) {
    return { valid: false, missingQuestion: 2 };
  }

  return { valid: true };
};

export const findQuestion = async (questionId: string) => {
  if (mongoose.Types.ObjectId.isValid(questionId)) {
    const question = await Question.findById(questionId);
    if (question) return question;
    return await Question.findOne({ questionId: questionId });
  }
  return await Question.findOne({ questionId: questionId });
};

export const extractUserGender = (answers: AnswerItem[]): string | undefined => {
  const question10Answer = answers.find((ans) => ans.questionId === "question_10");
  if (question10Answer && typeof question10Answer.selectedOption === "string") {
    return question10Answer.selectedOption.toLowerCase().includes("female")
      ? "female"
      : "male";
  }
  return undefined;
};

export const calculateAndAssignSessions = async (userAnswer: any) => {
  const userGender = extractUserGender(userAnswer.answers);
  const sessionResult = assignSessionsFromAnswers(userAnswer.answers, userGender);
  (userAnswer as any).assignedSessions = sessionResult.assignedSessions;
  (userAnswer as any).sessionAssignments = sessionResult.sessionAssignments;
  await userAnswer.save();
  return userAnswer;
};

export const safeJsonParse = (jsonString: string | null | undefined): any => {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString);
  } catch {
    return jsonString;
  }
};