import { z } from "zod";

const dateSchema = z.preprocess(
  (val) => val === undefined || val === null ? "" : val,
  z.string().min(1, "Date is required").refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    {
      message: "Date must be a valid date string in format YYYY-MM-DD",
    }
  )
);

const answerSchema = z.object({
  questionId: z.string().min(1, "Question ID is required"),
  answer: z.union([z.string(), z.number()]),
}).superRefine((data, ctx) => {
  const ratingQuestions = ["question_2", "question_3", "question_4"];
  if (ratingQuestions.includes(data.questionId)) {
    if (typeof data.answer !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${data.questionId} must be a number (rating type)`,
        path: ["answer"],
      });
    }
  }
});

export const createDailySessionSchema = z.object({
  date: dateSchema,
  answers: z.array(answerSchema)
    .min(6, "All 6 questions (question_1 to question_6) are required")
    .max(6, "Only 6 questions (question_1 to question_6) are allowed")
    .refine(
      (answers) => {
        const questionIds = answers.map(a => a.questionId);
        const requiredQuestions = ["question_1", "question_2", "question_3", "question_4", "question_5", "question_6"];
        return requiredQuestions.every(q => questionIds.includes(q));
      },
      {
        message: "All questions from question_1 to question_6 must be provided",
      }
    ),
  feedback: z.string().optional(),
});

export const getDailySessionsSchema = z.object({
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});