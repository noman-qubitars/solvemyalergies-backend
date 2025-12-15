import {
  createDailySessionModel,
  findDailySessionByUserAndDate,
  findDailySessionByUserAndDateLean,
  findDailySessions,
} from "../../models/DailySession";
import { DailySessionQuestion } from "../../models/DailySessionQuestion";

export interface CreateDailySessionData {
  userId: string;
  date: Date;
  answers: {
    questionId: string;
    answer: string | number;
  }[];
  feedback?: string;
}

export interface GetDailySessionsParams {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

const parseDateToUTC = (dateInput: Date | string): Date => {
  const dateStr = typeof dateInput === 'string' ? dateInput : dateInput.toISOString().split('T')[0];
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

export const createDailySession = async (data: CreateDailySessionData) => {
  const { userId, date, answers, feedback } = data;

  const sessionDate = parseDateToUTC(date);

  const existingSession = await findDailySessionByUserAndDate(userId, sessionDate);

  if (existingSession) {
    throw new Error("You have already submitted a session for this date. Each day allows only one session.");
  }

  const session = await createDailySessionModel({
    userId,
    date: sessionDate,
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
  const { userId, startDate, endDate } = params;

  const query: any = {};

  if (userId) {
    query.userId = userId;
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      query.date.$gte = parseDateToUTC(startDate);
    }
    if (endDate) {
      const end = parseDateToUTC(endDate);
      end.setUTCHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
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
    total: sessionsWithQuestions.length,
  };
};

export const getDailySessionByDate = async (userId: string, date: Date) => {
  const sessionDate = parseDateToUTC(date);

  const session = await findDailySessionByUserAndDateLean(userId, sessionDate);

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

