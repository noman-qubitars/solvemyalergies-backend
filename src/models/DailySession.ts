import mongoose, { Document } from "mongoose";
import { DailySessionSchema, IDailySession } from "../schemas/DailySession.schema";

export interface IDailySessionDocument extends IDailySession, Document {}

export const DailySessionModel = mongoose.model<IDailySessionDocument>("DailySession", DailySessionSchema);

export { DailySessionModel as DailySession };
export { IDailySession, DailySessionSchema };

export const createDailySessionModel = async (sessionData: {
  userId: string;
  date: Date;
  answers: {
    questionId: string;
    answer: string | number;
  }[];
  feedback?: string;
}) => {
  return await DailySessionModel.create(sessionData);
};

export const findDailySessionByUserAndDate = async (userId: string, date: Date) => {
  return await DailySessionModel.findOne({
    userId,
    date,
  });
};

export const findDailySessionByUserAndDateLean = async (userId: string, date: Date) => {
  return await DailySessionModel.findOne({
    userId,
    date,
  }).lean();
};

export const findDailySessions = async (query: {
  userId?: string;
  date?: {
    $gte?: Date;
    $lte?: Date;
  };
}) => {
  return await DailySessionModel.find(query)
    .sort({ date: -1 })
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
