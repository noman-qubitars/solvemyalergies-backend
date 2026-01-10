import mongoose, { Document } from "mongoose";
import { DailySessionSchema, IDailySession } from "../schemas/DailySession.schema";

export interface IDailySessionDocument extends IDailySession, Document {}

export const DailySessionModel = mongoose.model<IDailySessionDocument>("DailySession", DailySessionSchema);

export { DailySessionModel as DailySession };
export { IDailySession, DailySessionSchema };

export const createDailySessionModel = async (sessionData: {
  userId: string;
  day: number;
  answers: {
    questionId: string;
    answer: string | number;
  }[];
  feedback?: string;
}) => {
  return await DailySessionModel.create(sessionData);
};

export const findDailySessionByUserAndDay = async (userId: string, day: number) => {
  return await DailySessionModel.findOne({
    userId,
    day,
  });
};

export const findDailySessionByUserAndDayLean = async (userId: string, day: number) => {
  return await DailySessionModel.findOne({
    userId,
    day,
  }).lean();
};

export const findDailySessions = async (query: {
  userId?: string;
  day?: number | { $gte?: number; $lte?: number };
}) => {
  return await DailySessionModel.find(query)
    .sort({ day: 1 })
    .lean();
};

export const findDailySessionById = async (sessionId: string) => {
  return await DailySessionModel.findById(sessionId);
};

export const updateDailySessionById = async (
  sessionId: string,
  updateData: Partial<IDailySession>
) => {
  return await DailySessionModel.findByIdAndUpdate(
    sessionId,
    updateData,
    { new: true }
  );
};

export const deleteDailySessionById = async (sessionId: string) => {
  return await DailySessionModel.findByIdAndDelete(sessionId);
};