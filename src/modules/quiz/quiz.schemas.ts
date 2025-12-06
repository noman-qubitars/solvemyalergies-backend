import { z } from "zod";

export const answerSchema = z.object({
  questionId: z.string().min(1, "Question ID is required"),
  questionType: z.enum(["single", "multi"]),
  selectedOption: z.union([z.string().min(1), z.array(z.string()).min(1)]),
}).refine(
  (data) => {
    if (data.questionType === "single") {
      return typeof data.selectedOption === "string";
    } else {
      return Array.isArray(data.selectedOption);
    }
  },
  {
    message: "For single type, provide string. For multi type, provide array."
  }
);

export const updateAnswerSchema = z.object({
  questionId: z.string().min(1, "Question ID is required"),
  questionType: z.enum(["single", "multi"]),
  selectedOption: z.union([z.string().min(1), z.array(z.string()).min(1)]),
}).refine(
  (data) => {
    if (data.questionType === "single") {
      return typeof data.selectedOption === "string";
    } else {
      return Array.isArray(data.selectedOption);
    }
  },
  {
    message: "For single type, provide string. For multi type, provide array."
  }
);

