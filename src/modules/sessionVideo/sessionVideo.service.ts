import { SessionVideo, ISessionVideo } from "../../models/SessionVideo";

export const createSessionVideo = async (data: {
  title: string;
  description?: string;
  videoUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  symptoms: string[];
  status: "uploaded" | "draft";
  videoDuration?: number;
  thumbnailUrl?: string;
}) => {
  const video = new SessionVideo(data);
  return await video.save();
};

export const getAllSessionVideos = async (status?: "uploaded" | "draft") => {
  const query = status ? { status } : {};
  return await SessionVideo.find(query).sort({ createdAt: -1 });
};

export const getSessionVideosBySymptoms = async (userSymptoms: string[], status?: "uploaded" | "draft") => {
  const query: any = {};
  
  if (status) {
    query.status = status;
  }

  if (userSymptoms && userSymptoms.length > 0) {
    query.symptoms = { $in: userSymptoms };
  }

  return await SessionVideo.find(query).sort({ createdAt: -1 });
};

export const getSessionVideoById = async (id: string) => {
  return await SessionVideo.findById(id);
};

export const updateSessionVideo = async (
  id: string,
  data: {
    title?: string;
    description?: string;
    symptoms?: string[];
    status?: "uploaded" | "draft";
    videoUrl?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    videoDuration?: number;
    thumbnailUrl?: string;
  }
) => {
  return await SessionVideo.findByIdAndUpdate(
    id,
    { ...data, updatedAt: new Date() },
    { new: true }
  );
};

export const deleteSessionVideo = async (id: string) => {
  return await SessionVideo.findByIdAndDelete(id);
};