import mongoose, { Document } from "mongoose";
import { EducationalVideoSchema, IEducationalVideo } from "../schemas/EducationalVideo.schema";

export interface IEducationalVideoDocument extends IEducationalVideo, Document {}

export const EducationalVideoModel = mongoose.model<IEducationalVideoDocument>("EducationalVideo", EducationalVideoSchema);

export { EducationalVideoModel as EducationalVideo };
export { IEducationalVideo, EducationalVideoSchema };

export const createEducationalVideoModel = async (videoData: {
  title: string;
  description?: string;
  videoUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: "uploaded" | "draft";
}) => {
  return await EducationalVideoModel.create(videoData);
};

export const findEducationalVideoById = async (videoId: string) => {
  return await EducationalVideoModel.findById(videoId);
};

export const findEducationalVideos = async (
  query: { status?: "uploaded" | "draft" },
  skip?: number,
  limit?: number
) => {
  const findQuery = EducationalVideoModel.find(query).sort({ createdAt: -1 });
  
  if (skip !== undefined) {
    findQuery.skip(skip);
  }
  
  if (limit !== undefined) {
    findQuery.limit(limit);
  }
  
  return await findQuery;
};

export const countEducationalVideos = async (query: { status?: "uploaded" | "draft" }) => {
  return await EducationalVideoModel.countDocuments(query);
};

export const updateEducationalVideoById = async (
  videoId: string,
  updateData: Partial<IEducationalVideo>
) => {
  return await EducationalVideoModel.findByIdAndUpdate(
    videoId,
    { ...updateData, updatedAt: new Date() },
    { new: true }
  );
};

export const deleteEducationalVideoById = async (videoId: string) => {
  return await EducationalVideoModel.findByIdAndDelete(videoId);
};