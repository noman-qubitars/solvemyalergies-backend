import { z } from "zod";

export const sendMessageSchema = z.object({
  content: z.string().optional(),
  messageType: z.enum(["text", "voice", "image", "document", "pdf"]),
});

export const getMessagesSchema = z.object({
  userId: z.string().optional(),
  isRead: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const markAsReadSchema = z.object({
  messageIds: z.array(z.string()).min(1, "At least one message ID is required"),
});

