import mongoose from "mongoose";
import { Question } from "../../../models/Question";
import { AnswerItem } from "../../../models/UserAnswer";

export const getQuestionNumber = (questionId: string): number | null => {
  const match = questionId.match(/question_(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

const TAIL_EXERCISE = "question_36";
const TAIL_WORKOUT = "question_39";
const TAIL_PILLS = "question_37";
const TAIL_MEDS = "question_40";
const TAIL_TIMING = "question_38";
const TAIL_REMINDER = "question_41";

const TAIL_IDS = new Set([
  TAIL_EXERCISE,
  TAIL_WORKOUT,
  TAIL_PILLS,
  TAIL_MEDS,
  TAIL_TIMING,
  TAIL_REMINDER,
]);

const tailAnswered = (
  answers: Array<{ questionId: string }>,
  id: string
): boolean => answers.some((a) => a.questionId === id);

const userExercisesFromAnswers = (
  answers: Array<{ questionId: string; selectedOption?: unknown }>
): boolean | null => {
  const row = answers.find((a) => a.questionId === TAIL_EXERCISE);
  if (!row || typeof row.selectedOption !== "string") return null;
  return row.selectedOption.trim().toLowerCase() !== "never";
};

export const validateTailQuestionPrerequisites = (
  questionId: string,
  existingAnswers: Array<{ questionId: string; selectedOption?: unknown }>
): { valid: boolean; message?: string } => {
  if (!TAIL_IDS.has(questionId)) return { valid: true };

  if (questionId === TAIL_EXERCISE) return { valid: true };

  if (questionId === TAIL_WORKOUT) {
    if (!tailAnswered(existingAnswers, TAIL_EXERCISE)) {
      return {
        valid: false,
        message: `You must answer ${TAIL_EXERCISE} first before answering ${questionId}`,
      };
    }
    if (userExercisesFromAnswers(existingAnswers) !== true) {
      return {
        valid: false,
        message: "Workout details apply only when you exercise",
      };
    }
    return { valid: true };
  }

  if (questionId === TAIL_PILLS) {
    if (!tailAnswered(existingAnswers, TAIL_EXERCISE)) {
      return {
        valid: false,
        message: `You must answer ${TAIL_EXERCISE} first before answering ${questionId}`,
      };
    }
    if (
      userExercisesFromAnswers(existingAnswers) === true &&
      !tailAnswered(existingAnswers, TAIL_WORKOUT)
    ) {
      return {
        valid: false,
        message: `You must answer ${TAIL_WORKOUT} first before answering ${questionId}`,
      };
    }
    return { valid: true };
  }

  if (questionId === TAIL_MEDS) {
    if (!tailAnswered(existingAnswers, TAIL_PILLS)) {
      return {
        valid: false,
        message: `You must answer ${TAIL_PILLS} first before answering ${questionId}`,
      };
    }
    return { valid: true };
  }

  if (questionId === TAIL_TIMING) {
    if (!tailAnswered(existingAnswers, TAIL_MEDS)) {
      return {
        valid: false,
        message: `You must answer ${TAIL_MEDS} first before answering ${questionId}`,
      };
    }
    return { valid: true };
  }

  if (questionId === TAIL_REMINDER) {
    if (!tailAnswered(existingAnswers, TAIL_TIMING)) {
      return {
        valid: false,
        message: `You must answer ${TAIL_TIMING} first before answering ${questionId}`,
      };
    }
    return { valid: true };
  }

  return { valid: true };
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