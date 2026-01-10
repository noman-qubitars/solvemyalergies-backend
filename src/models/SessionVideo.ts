import mongoose, { Schema, Document } from "mongoose";

export interface ISessionVideo extends Document {
  title: string;
  description: string;
  videoUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  symptoms: string[];
  status: "uploaded" | "draft";
  videoDuration?: number; 
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SessionVideoSchema = new Schema<ISessionVideo>(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    videoUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    symptoms: { type: [String], default: [] },
    status: { type: String, enum: ["uploaded", "draft"], default: "uploaded" },
    videoDuration: { type: Number }, 
    thumbnailUrl: { type: String }, 
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "sessionVideos" }
);

SessionVideoSchema.index({ status: 1, createdAt: -1 });
SessionVideoSchema.index({ symptoms: 1 });

export const SessionVideo = mongoose.model<ISessionVideo>("SessionVideo", SessionVideoSchema);