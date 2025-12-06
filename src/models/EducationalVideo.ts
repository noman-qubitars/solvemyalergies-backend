import mongoose, { Schema, Document } from "mongoose";

export interface IEducationalVideo extends Document {
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

const EducationalVideoSchema = new Schema<IEducationalVideo>(
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

export const EducationalVideo = mongoose.model<IEducationalVideo>("EducationalVideo", EducationalVideoSchema);