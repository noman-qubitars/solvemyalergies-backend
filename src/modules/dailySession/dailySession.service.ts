import {
  createDailySessionModel,
  findDailySessionByUserAndDay,
  findDailySessionByUserAndDayLean,
  findDailySessions,
} from "../../models/DailySession";
import { DailySessionQuestion } from "../../models/DailySessionQuestion";

export interface CreateDailySessionData {
  userId: string;
  day: number;
  answers: {
    questionId: string;
    answer: string | number;
  }[];
  feedback?: string;
}

export interface GetDailySessionsParams {
  userId?: string;
  day?: number;
}

export const createDailySession = async (data: CreateDailySessionData) => {
  const { userId, day, answers, feedback } = data;

  const existingSession = await findDailySessionByUserAndDay(userId, day);

  if (existingSession) {
    throw new Error("You have already submitted a session for this day. Each day allows only one session.");
  }

  const session = await createDailySessionModel({
    userId,
    day,
    answers,
    feedback,
  });

  return {
    success: true,
    message: "Daily session created successfully",
    data: session,
  };
};

export const getDailySessions = async (params: GetDailySessionsParams) => {
  const { userId, day } = params;

  const query: any = {};

  if (userId) {
    query.userId = userId;
  }

  if (day !== undefined && day !== null) {
    query.day = day;
  }

  const sessions = await findDailySessions(query);

  const allQuestionIds = new Set<string>();
  sessions.forEach((session: any) => {
    session.answers.forEach((answer: any) => {
      allQuestionIds.add(answer.questionId);
    });
  });

  const questions = await DailySessionQuestion.find({
    questionId: { $in: Array.from(allQuestionIds) }
  }).lean();

  const questionMap = new Map(
    questions.map((q: any) => [q.questionId, q])
  );

  const sessionsWithQuestions = sessions.map((session: any) => ({
    ...session,
    answers: session.answers.map((answer: any) => ({
      ...answer,
      question: questionMap.get(answer.questionId) || null
    }))
  }));

  return {
    success: true,
    data: sessionsWithQuestions,
  };
};

export const getDailySessionByDay = async (userId: string, day: number) => {
  const session = await findDailySessionByUserAndDayLean(userId, day);

  if (!session) {
    return null;
  }

  const questionIds = (session as any).answers.map((a: any) => a.questionId);
  const questions = await DailySessionQuestion.find({
    questionId: { $in: questionIds }
  }).lean();

  const questionMap = new Map(
    questions.map((q: any) => [q.questionId, q])
  );

  return {
    ...session,
    answers: (session as any).answers.map((answer: any) => ({
      ...answer,
      question: questionMap.get(answer.questionId) || null
    }))
  };
};