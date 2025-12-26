import mongoose, { Document } from "mongoose";
import { UserSessionSchema, IUserSession } from "../schemas/UserSession.schema";

export interface IUserSessionDocument extends IUserSession, Document {}

export const UserSessionModel = mongoose.model<IUserSessionDocument>("UserSession", UserSessionSchema);

export { UserSessionModel as UserSession };
export { IUserSession, UserSessionSchema };

export const createUserSession = async (userId: string) => {
  return await UserSessionModel.create({
    userId,
    startTime: new Date(),
    isActive: true
  });
};

export const endUserSession = async (userId: string) => {
  const activeSession = await UserSessionModel.findOne({
    userId,
    isActive: true
  }).sort({ startTime: -1 });

  if (!activeSession) {
    return null;
  }

  const endTime = new Date();
  const duration = Math.floor((endTime.getTime() - activeSession.startTime.getTime()) / 1000);

  activeSession.endTime = endTime;
  activeSession.duration = duration;
  activeSession.isActive = false;
  
  return await activeSession.save();
};

export const endAllActiveSessions = async (userId: string) => {
  const endTime = new Date();
  const activeSessions = await UserSessionModel.find({
    userId,
    isActive: true
  });

  const updatePromises = activeSessions.map(async (session) => {
    const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);
    session.endTime = endTime;
    session.duration = duration;
    session.isActive = false;
    return await session.save();
  });

  return await Promise.all(updatePromises);
};

export const getActiveSession = async (userId: string) => {
  return await UserSessionModel.findOne({
    userId,
    isActive: true
  }).sort({ startTime: -1 });
};

export const getUserSessions = async (userId: string, limit: number = 50) => {
  return await UserSessionModel.find({ userId })
    .sort({ startTime: -1 })
    .limit(limit);
};