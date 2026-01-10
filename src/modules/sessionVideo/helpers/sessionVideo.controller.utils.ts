/**
 * Normalize symptom string by removing parentheses content, normalizing whitespace, and lowercasing
 */
export const normalizeSymptom = (symptom: string): string => {
  return symptom
    .replace(/\([^)]*\)/g, '') // Remove content in parentheses
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .toLowerCase();
};

/**
 * Extract symptoms from user's quiz answers
 * Extracts from question_2 (main symptoms) and question_3 (detailed headache symptoms)
 */
export const extractSymptomsFromAnswers = (answers: any[]): string[] => {
  const symptoms: string[] = [];
  
  // Extract from question_2 (main symptoms like "Headache")
  const question2Answer = answers.find(ans => ans.questionId === "question_2");
  if (question2Answer && question2Answer.selectedOption) {
    if (Array.isArray(question2Answer.selectedOption)) {
      symptoms.push(...question2Answer.selectedOption);
    } else {
      symptoms.push(question2Answer.selectedOption);
    }
  }

  // Extract from question_3 (detailed headache symptoms like "Throbbing headache", "Pressure headache", etc.)
  const question3Answer = answers.find(ans => ans.questionId === "question_3");
  if (question3Answer && question3Answer.selectedOption) {
    if (Array.isArray(question3Answer.selectedOption)) {
      symptoms.push(...question3Answer.selectedOption);
    } else {
      symptoms.push(question3Answer.selectedOption);
    }
  }

  return symptoms
    .map(s => normalizeSymptom(s))
    .filter(s => s.length > 0);
};

/**
 * Match user symptoms with video symptoms using flexible matching
 * Returns true if any video symptom matches any user symptom
 */
export const matchSymptoms = (userSymptoms: string[], videoSymptoms: string[]): boolean => {
  if (videoSymptoms.length === 0) return true;
  
  const normalizedUserSymptoms = userSymptoms.map(normalizeSymptom);
  const normalizedVideoSymptoms = videoSymptoms.map(normalizeSymptom);
  
  // Check if any video symptom matches any user symptom
  // Use flexible matching: check if video symptom contains user symptom or vice versa
  return normalizedVideoSymptoms.some(vs => {
    return normalizedUserSymptoms.some(us => {
      // Exact match
      if (vs === us) return true;
      // Video symptom contains user symptom (e.g., "throbbing headache" contains "throbbing")
      if (vs.includes(us)) return true;
      // User symptom contains video symptom (e.g., "pressure headache (not sinus...)" contains "pressure headache")
      if (us.includes(vs)) return true;
      // Check if key words match (split by spaces and check for common words)
      const vsWords = vs.split(/\s+/).filter(w => w.length > 2);
      const usWords = us.split(/\s+/).filter(w => w.length > 2);
      return vsWords.some(vw => usWords.includes(vw)) || usWords.some(uw => vsWords.includes(uw));
    });
  });
};

/**
 * Format seconds to HH:MM:SS format
 */
export const formatDuration = (seconds: number | null | undefined): string | null => {
  if (!seconds || seconds < 0) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};