import { Schema } from "mongoose";

export interface IEducationalVideo {
  title: string;
  description: string;
  videoUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: "uploaded" | "draft";
  createdAt: Date;
  updatedAt: Date;
}

export const EducationalVideoSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    videoUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    status: { type: String, enum: ["uploaded", "draft"], default: "uploaded" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "educationalVideos" }
);

EducationalVideoSchema.index({ status: 1, createdAt: -1 });