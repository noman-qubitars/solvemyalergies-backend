// Parse DD-MM-YYYY format to Date
export const parseDayFormat = (dayStr: string): Date => {
  const [day, month, year] = dayStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

// Get today's date in Asia timezone (Asia/Karachi = UTC+5:00)
export const getTodayInAsiaTimezone = (): Date => {
  const now = new Date();
  // Convert to Asia/Karachi timezone (UTC+5:00)
  // Get the date string in Asia timezone
  const asiaDateString = now.toLocaleString('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // Parse the date string (format: MM/DD/YYYY)
  const [month, day, year] = asiaDateString.split('/').map(Number);
  
  // Create UTC date using Asia date components (stored as UTC midnight)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

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

/**
 * Check if user can skip to a specific day based on their questionnaire answers
 * @param answers - User's questionnaire answers from UserAnswer model
 * @param targetDay - The day number the user wants to access
 * @returns true if user can skip to this day, false otherwise
 */
export const canSkipToDay = (answers: Array<{ questionId: string; selectedOption: string | string[] }>, targetDay: number): boolean => {
  // Mapping of symptoms to allowed skip days
  // Based on the screenshot: "throbbing" symptom allows skipping to day 4
  const symptomToDayMap: Record<string, number[]> = {
    "throbbing headache": [4],
    "throbbing": [4], // Also allow just "throbbing" to match
    "constant": [5],
    "pressure headache": [8],
    "pressure": [8], // Also allow just "pressure" to match
    "sinus headache": [8],
    "sinus": [8], // Also allow just "sinus" to match
    "located mainly in forehead": [9],
    "forehead": [9], // Also allow just "forehead" to match
    "behind eyes": [9],
    "behind": [9], // Also allow just "behind" to match
    "in temples": [9],
    "temples": [9], // Also allow just "temples" to match
    "back of head/base of skull": [11],
    "back of head": [11],
    "base of skull": [11],
    "all over head": [11],
    "all over": [11],
    "affects vision": [11],
    "vision": [11], // Also allow just "vision" to match
  };

  console.log(`[canSkipToDay] Checking skip for day ${targetDay}`, { 
    answersCount: answers.length,
    answers: answers.map(a => ({ questionId: a.questionId, selectedOption: a.selectedOption }))
  });

  // Find question_2 answer (main symptoms like "Headache")
  const question2Answer = answers.find(ans => ans.questionId === "question_2");
  console.log(`[canSkipToDay] question_2 answer:`, question2Answer);
  
  if (!question2Answer || !question2Answer.selectedOption) {
    console.log(`[canSkipToDay] No question_2 answer found, returning false`);
    return false;
  }
  
  const hasHeadache = Array.isArray(question2Answer.selectedOption)
    ? question2Answer.selectedOption.some((opt: string) => opt.toLowerCase().includes("headache"))
    : question2Answer.selectedOption.toString().toLowerCase().includes("headache");

  console.log(`[canSkipToDay] hasHeadache: ${hasHeadache}`, {
    selectedOption: question2Answer.selectedOption
  });

  if (!hasHeadache) {
    console.log(`[canSkipToDay] No headache found in question_2, returning false`);
    return false;
  }

  // Find question_3 answer (headache-specific symptoms like "throbbing")
  const question3Answer = answers.find(ans => ans.questionId === "question_3");
  console.log(`[canSkipToDay] question_3 answer:`, question3Answer);
  
  if (!question3Answer || !question3Answer.selectedOption) {
    console.log(`[canSkipToDay] No question_3 answer found, returning false`);
    return false;
  }

  const headacheSymptoms = Array.isArray(question3Answer.selectedOption)
    ? question3Answer.selectedOption.map((opt: string) => opt.toLowerCase().trim())
    : [question3Answer.selectedOption.toString().toLowerCase().trim()];

  console.log(`[canSkipToDay] headacheSymptoms:`, headacheSymptoms);

  // Check if any of the selected headache symptoms allow skipping to the target day
  for (const symptom of headacheSymptoms) {
    for (const [mappedSymptom, allowedDays] of Object.entries(symptomToDayMap)) {
      // Normalize both strings for comparison (remove extra spaces, special chars, parentheses content)
      const normalizeString = (str: string) => {
        return str
          .replace(/\([^)]*\)/g, '') // Remove content in parentheses
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim()
          .toLowerCase();
      };
      
      const normalizedSymptom = normalizeString(symptom);
      const normalizedMapped = normalizeString(mappedSymptom);
      
      // Check if symptom matches (either contains or is contained, or exact match)
      // Also check if key words match (e.g., "throbbing" in "throbbing headache")
      const symptomWords = normalizedSymptom.split(/\s+/).filter(w => w.length > 2); // Filter out short words
      const mappedWords = normalizedMapped.split(/\s+/).filter(w => w.length > 2);
      
      const hasKeyWordMatch = symptomWords.some(word => mappedWords.includes(word)) || 
                              mappedWords.some(word => symptomWords.includes(word));
      
      const isExactMatch = normalizedSymptom === normalizedMapped;
      const symptomContainsMapped = normalizedSymptom.includes(normalizedMapped);
      const mappedContainsSymptom = normalizedMapped.includes(normalizedSymptom);
      
      // Additional check: if the key word (like "throbbing") is in the symptom, it should match
      // This handles cases like "Throbbing headache" matching "throbbing headache"
      const keyWordMatch = mappedWords.length > 0 && symptomWords.some(sw => 
        mappedWords.some(mw => sw.includes(mw) || mw.includes(sw))
      );
      
      // Direct substring check - if symptom contains mapped symptom or vice versa (case-insensitive)
      const directMatch = normalizedSymptom.indexOf(normalizedMapped) !== -1 || 
                         normalizedMapped.indexOf(normalizedSymptom) !== -1;
      
      console.log(`[canSkipToDay] Comparing "${symptom}" (normalized: "${normalizedSymptom}") with "${mappedSymptom}" (normalized: "${normalizedMapped}")`, {
        isExactMatch,
        symptomContainsMapped,
        mappedContainsSymptom,
        hasKeyWordMatch,
        keyWordMatch,
        directMatch,
        allowedDays,
        targetDay,
        symptomWords,
        mappedWords
      });
      
      if (isExactMatch || 
          symptomContainsMapped || 
          mappedContainsSymptom ||
          hasKeyWordMatch ||
          keyWordMatch ||
          directMatch) {
        if (allowedDays.includes(targetDay)) {
          console.log(`[canSkipToDay] Match found! Allowing skip to day ${targetDay}`);
          return true;
        } else {
          console.log(`[canSkipToDay] Symptom matches but targetDay ${targetDay} not in allowedDays ${JSON.stringify(allowedDays)}`);
        }
      }
    }
  }

  console.log(`[canSkipToDay] No match found, returning false`);
  return false;
};