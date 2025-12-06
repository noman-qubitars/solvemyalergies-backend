import { EducationalVideo, IEducationalVideo } from "../../models/EducationalVideo";

export const createEducationalVideo = async (data: {
  title: string;
  description?: string;
  videoUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: "uploaded" | "draft";
}) => {
  const video = new EducationalVideo(data);
  return await video.save();
};

export const getAllEducationalVideos = async (status?: "uploaded" | "draft") => {
  const query = status ? { status } : {};
  return await EducationalVideo.find(query).sort({ createdAt: -1 });
};

export const getEducationalVideoById = async (id: string) => {
  return await EducationalVideo.findById(id);
};

export const updateEducationalVideo = async (
  id: string,
  data: {
    title?: string;
    description?: string;
    status?: "uploaded" | "draft";
    videoUrl?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }
) => {
  return await EducationalVideo.findByIdAndUpdate(
    id,
    { ...data, updatedAt: new Date() },
    { new: true }
  );
};

export const deleteEducationalVideo = async (id: string) => {
  return await EducationalVideo.findByIdAndDelete(id);
};

