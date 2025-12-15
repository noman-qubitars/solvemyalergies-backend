export const parseDateToUTC = (date: string | Date): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Date(Date.UTC(
    dateObj.getUTCFullYear(),
    dateObj.getUTCMonth(),
    dateObj.getUTCDate(),
    0,
    0,
    0,
    0
  ));
};

export const isValidDate = (date: Date): boolean => {
  return !isNaN(date.getTime());
};

export const isTodayDate = (date: Date): boolean => {
  const today = new Date();
  const todayUTC = parseDateToUTC(today);
  const inputDateUTC = parseDateToUTC(date);
  return inputDateUTC.getTime() === todayUTC.getTime();
};

export const REQUIRED_QUESTIONS = ["question_1", "question_2", "question_3", "question_4", "question_5", "question_6"];
export const RATING_QUESTIONS = ["question_2", "question_3", "question_4"];

export const validateRequiredQuestions = (answers: Array<{ questionId: string }>): { valid: boolean; missing?: string[] } => {
  const providedQuestionIds = answers.map(a => a.questionId);
  const missingQuestions = REQUIRED_QUESTIONS.filter(q => !providedQuestionIds.includes(q));
  
  if (missingQuestions.length > 0) {
    return { valid: false, missing: missingQuestions };
  }
  
  return { valid: true };
};

export const validateAnswer = (answer: { questionId?: string; answer?: any }): { valid: boolean; error?: string } => {
  if (!answer.questionId) {
    return { valid: false, error: "Each answer must have a questionId" };
  }

  if (answer.answer === undefined || answer.answer === null) {
    return { valid: false, error: `Answer for ${answer.questionId} is required` };
  }

  if (RATING_QUESTIONS.includes(answer.questionId)) {
    if (typeof answer.answer !== "number") {
      return { valid: false, error: `${answer.questionId} must be a number (rating type)` };
    }
  }

  return { valid: true };
};

export const buildGetSessionsParams = (
  userId?: string,
  startDate?: string,
  endDate?: string,
  isAdmin?: boolean,
  requestUserId?: string
): { userId?: string; startDate?: Date; endDate?: Date } => {
  const params: { userId?: string; startDate?: Date; endDate?: Date } = {};

  if (isAdmin && userId) {
    params.userId = userId;
  } else if (!isAdmin && requestUserId) {
    params.userId = requestUserId;
  }

  if (startDate) {
    params.startDate = new Date(startDate);
  }

  if (endDate) {
    params.endDate = new Date(endDate);
  }

  return params;
};