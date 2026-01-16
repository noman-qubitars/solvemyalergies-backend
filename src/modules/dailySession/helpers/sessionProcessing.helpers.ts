import { checkVideoCompletedForDay } from "../../videoWatchTracking/videoWatchTracking.service";
import { calculateCanSubmit } from "./videoCompletion.helpers";
import { UserAnswer } from "../../../models/UserAnswer";

export interface DayWithFlags {
  day: number;
  videoCompleted: boolean;
  canSubmit: boolean;
  answers: any[];
}

/**
 * Processes sessions and groups them by day with video completion and canSubmit flags
 */
export const processSessionsByDay = async (
  sessions: any[],
  userId: string
): Promise<DayWithFlags[]> => {
  // Get user answers once for skip checking (used for multiple days)
  let userAnswer: any = null;
  try {
    userAnswer = await UserAnswer.findOne({ userId });
  } catch (error) {
    // Error fetching user answers, continue without skip check
  }

  // Group sessions by day
  const sessionsByDay = new Map<number, any[]>();
  sessions.forEach((session: any) => {
    const day = Number(session.day);
    if (!sessionsByDay.has(day)) {
      sessionsByDay.set(day, []);
    }
    sessionsByDay.get(day)!.push(session);
  });

  // Process each day to add videoCompleted and canSubmit
  const daysWithFlags = await Promise.all(
    Array.from(sessionsByDay.entries()).map(async ([day, daySessions]) => {
      // CHECK 1: videoCompleted for this specific day (independent check)
      const videoCompleted = await checkVideoCompletedForDay(userId, day);
      
      // CHECK 2: canSubmit for this specific day (independent check)
      const canSubmit = await calculateCanSubmit(userId, day, daySessions.length > 0, userAnswer);
      
      // Extract answers from the first session (if exists)
      const answers = daySessions.length > 0 ? (daySessions[0].answers || []) : [];
      
      return {
        day,
        videoCompleted,
        canSubmit,
        answers,
      };
    })
  );

  // Sort by day number
  daysWithFlags.sort((a, b) => a.day - b.day);

  return daysWithFlags;
};

/**
 * Adds a specific day to the processed sessions if it doesn't exist
 */
export const addDayIfMissing = async (
  daysWithFlags: DayWithFlags[],
  dayNum: number,
  userId: string,
  userAnswer?: any
): Promise<DayWithFlags[]> => {
  const dayExists = daysWithFlags.some((d) => d.day === dayNum);
  
  if (!dayExists) {
    // No session for this day, check flags independently
    const videoCompleted = await checkVideoCompletedForDay(userId, dayNum);
    const canSubmit = await calculateCanSubmit(userId, dayNum, false, userAnswer); // No session exists
    
    // Add entry with flags for the requested day (empty answers array)
    daysWithFlags.push({
      day: dayNum,
      videoCompleted,
      canSubmit,
      answers: [],
    });
    
    // Re-sort after adding
    daysWithFlags.sort((a, b) => a.day - b.day);
  }

  return daysWithFlags;
};