import { AnswerItem } from "../models/UserAnswer";

export const assignSessionsFromAnswers = (
  answers: AnswerItem[],
  userGender?: string
): {
  assignedSessions: string[];
  sessionAssignments: Record<string, any>;
} => {
  return {
    assignedSessions: [],
    sessionAssignments: {},
  };
};