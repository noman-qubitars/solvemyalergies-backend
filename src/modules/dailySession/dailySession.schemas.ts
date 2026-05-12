import { z } from "zod";

const daySchema = z.preprocess(
  (val) => (val === undefined || val === null ? undefined : Number(val)),
  z
    .number()
    .int("Day must be an integer between 1 and 42")
    .min(1, "Day is required and must be between 1 and 42")
    .max(42, "Day must be between 1 and 42")
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
  day: daySchema,
  answers: z.array(answerSchema)
    .min(4, "At least 4 answers are required (question_1, question_2, question_5, question_6)")
    .max(6, "Maximum 6 answers are allowed"),
  feedback: z.string().optional(),
});

export const getDailySessionsSchema = z.object({
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});