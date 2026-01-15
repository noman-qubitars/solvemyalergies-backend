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

export const initiateUploadSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  mimetype: z.string().min(1, "MIME type is required"),
  totalSize: z.number().positive("Total size must be positive"),
});

export const completeUploadSchema = z.object({
  uploadId: z.string().min(1, "Upload ID is required"),
  key: z.string().min(1, "Key is required"),
  parts: z.array(
    z.object({
      partNumber: z.number().int().positive("Part number must be positive"),
      etag: z.string().min(1, "ETag is required"),
    })
  ).min(1, "At least one part is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  symptoms: z.array(z.string()).default([]),
  status: z.enum(["uploaded", "draft"]).default("uploaded"),
});

export const completeUpdateUploadSchema = z.object({
  uploadId: z.string().min(1, "Upload ID is required"),
  key: z.string().min(1, "Key is required"),
  parts: z.array(
    z.object({
      partNumber: z.number().int().positive("Part number must be positive"),
      etag: z.string().min(1, "ETag is required"),
    })
  ).min(1, "At least one part is required"),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
  status: z.enum(["uploaded", "draft"]).optional(),
});