import { z } from "zod";

export const createSessionVideoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  symptoms: z.array(z.string()).default([]),
  status: z.enum(["uploaded", "draft"]).default("uploaded"),
});

export const updateSessionVideoSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
  status: z.enum(["uploaded", "draft"]).optional(),
});

