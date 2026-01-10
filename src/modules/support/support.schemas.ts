import { z } from "zod";

export const sendFeedbackSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
  emoji: z.string().min(1, "Emoji is required"),
  message: z.string().min(1, "Message is required"),
});