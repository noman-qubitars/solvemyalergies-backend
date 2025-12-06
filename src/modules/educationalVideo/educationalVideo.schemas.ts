import { z } from "zod";

export const createEducationalVideoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["uploaded", "draft"]).default("uploaded"),
});

export const updateEducationalVideoSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  status: z.enum(["uploaded", "draft"]).optional(),
});

