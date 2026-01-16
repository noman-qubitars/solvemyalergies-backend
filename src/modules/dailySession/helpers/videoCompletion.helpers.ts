import { 
  checkVideoCompletedForDay, 
  checkPreviousDaysFormSubmittedButVideoNotWatched,
  checkPreviousDayVideoCompleted,
  checkAllPreviousDaysVideosCompleted 
} from "../../videoWatchTracking/videoWatchTracking.service";
import { findDailySessionByUserAndDay } from "../../../models/DailySession";
import { UserAnswer } from "../../../models/UserAnswer";
import { canSkipToDay } from "./dailySession.controller.utils";

/**
 * Validates if user can proceed to create a session for a given day
 * Checks video completion requirements and skip logic
 */
export const validateDayAccess = async (
  userId: string,
  dayNumber: number
): Promise<{ canProceed: boolean; errorDay?: number }> => {
  // Day 1 doesn't require previous video completion
  if (dayNumber === 1) {
    return { canProceed: true };
  }

  // Priority: First check if any previous day has form submitted but video not watched
  const { hasIncompleteVideo, firstDayWithIncompleteVideo } = await checkPreviousDaysFormSubmittedButVideoNotWatched(
    userId,
    dayNumber,
    findDailySessionByUserAndDay
  );
  
  if (hasIncompleteVideo && firstDayWithIncompleteVideo) {
    return { canProceed: false, errorDay: firstDayWithIncompleteVideo };
  }
  
  // If no form submitted with incomplete video, check skip logic
  let canSkip = false;
  try {
    const userAnswer = await UserAnswer.findOne({ userId });
    if (userAnswer && userAnswer.answers && userAnswer.answers.length > 0) {
      canSkip = canSkipToDay(userAnswer.answers, dayNumber);
    }
  } catch (error) {
    // If error fetching user answers, continue with normal check
  }

  // Only check all previous days' videos if user cannot skip
  if (!canSkip) {
    const { allCompleted, firstIncompleteDay } = await checkAllPreviousDaysVideosCompleted(userId, dayNumber);
    
    if (!allCompleted) {
      return { canProceed: false, errorDay: firstIncompleteDay || undefined };
    }
  }

  return { canProceed: true };
};

/**
 * Calculates if a user can submit a session for a specific day
 */
export const calculateCanSubmit = async (
  userId: string,
  day: number,
  sessionExists: boolean,
  userAnswer?: any
): Promise<boolean> => {
  if (sessionExists) {
    // Session already exists, so canSubmit is true (already submitted)
    return true;
  }
  
  if (day === 1) {
    // Day 1 can always be submitted
    return true;
  }
  
  // Check if user can skip to this day
  let canSkip = false;
  if (userAnswer && userAnswer.answers && userAnswer.answers.length > 0) {
    canSkip = canSkipToDay(userAnswer.answers, day);
  }
  
  if (canSkip) {
    return true;
  }
  
  // Check if previous day's video is completed
  return await checkPreviousDayVideoCompleted(userId, day);
};