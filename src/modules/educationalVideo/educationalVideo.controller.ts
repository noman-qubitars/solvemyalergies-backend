import { Request, Response } from "express";
import {
  createEducationalVideo,
  getAllEducationalVideos,
  getEducationalVideoById,
  updateEducationalVideo,
  deleteEducationalVideo,
} from "./educationalVideo.service";
import { AuthRequest } from "../../middleware/auth";
import {
  sendTitleRequiredError,
  sendVideoFileRequiredError,
  sendVideoNotFoundError,
  handleEducationalVideoError,
} from "./helpers/educationalVideo.controller.errors";
import {
  parseVideoStatus,
  buildVideoUrl,
  buildFilePath,
  deleteFileIfExists,
  buildUpdateData,
} from "./helpers/educationalVideo.controller.utils";
import { generateThumbnail } from "../../lib/generateThumbnail";

export const createVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, status } = req.body;

    if (!title) {
      return sendTitleRequiredError(res);
    }

    if (!req.file) {
      return sendVideoFileRequiredError(res);
    }

    const videoUrl = buildVideoUrl(req.file.path);
    
    let thumbnailUrl;
    try {
      thumbnailUrl = await generateThumbnail(req.file.path);
    } catch (thumbnailError: any) {
      console.error("⚠️  Failed to generate thumbnail:", thumbnailError.message);
      console.error("Video uploaded successfully but without thumbnail.");
    }

    const video = await createEducationalVideo({
      title,
      description: description || "",
      videoUrl,
      thumbnailUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: parseVideoStatus(status) || "uploaded",
    });

    res.status(201).json({
      success: true,
      message: "Educational video created successfully",
      data: video,
    });
  } catch (error) {
    return handleEducationalVideoError(res, error, "Failed to create educational video", 500);
  }
};

export const getVideos = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    const queryStatus = parseVideoStatus(status as string | undefined);

    const userId = req.userRole === "user" ? req.userId : undefined;
    const result = await getAllEducationalVideos(queryStatus, userId);

    res.status(200).json({
      success: true,
      data: result.videos,
      totalVideos: result.totalVideos,
    });
  } catch (error) {
    return handleEducationalVideoError(res, error, "Failed to fetch educational videos", 500);
  }
};

export const getVideoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const video = await getEducationalVideoById(id);

    if (!video) {
      return sendVideoNotFoundError(res);
    }

    res.status(200).json({
      success: true,
      data: video,
    });
  } catch (error) {
    return handleEducationalVideoError(res, error, "Failed to fetch educational video", 500);
  }
};

export const updateVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    if (req.file) {
      const existingVideo = await getEducationalVideoById(id);
      if (existingVideo?.videoUrl) {
        const oldFilePath = buildFilePath(existingVideo.videoUrl);
        deleteFileIfExists(oldFilePath);
      }
      if (existingVideo?.thumbnailUrl) {
        const oldThumbnailPath = buildFilePath(existingVideo.thumbnailUrl);
        deleteFileIfExists(oldThumbnailPath);
      }
    }

    const updateData = buildUpdateData(title, description, status, req.file);
    
    if (req.file) {
      try {
        const thumbnailUrl = await generateThumbnail(req.file.path);
        (updateData as any).thumbnailUrl = thumbnailUrl;
      } catch (thumbnailError: any) {
        console.error("⚠️  Failed to generate thumbnail:", thumbnailError.message);
        console.error("Video updated successfully but without thumbnail.");
      }
    }

    const video = await updateEducationalVideo(id, updateData);

    if (!video) {
      return sendVideoNotFoundError(res);
    }

    res.status(200).json({
      success: true,
      message: "Educational video updated successfully",
      data: video,
    });
  } catch (error) {
    return handleEducationalVideoError(res, error, "Failed to update educational video", 500);
  }
};

export const deleteVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const video = await getEducationalVideoById(id);
    if (!video) {
      return sendVideoNotFoundError(res);
    }

    if (video.videoUrl) {
      const filePath = buildFilePath(video.videoUrl);
      deleteFileIfExists(filePath);
    }

    if (video.thumbnailUrl) {
      const thumbnailPath = buildFilePath(video.thumbnailUrl);
      deleteFileIfExists(thumbnailPath);
    }

    await deleteEducationalVideo(id);

    res.status(200).json({
      success: true,
      message: "Educational video deleted successfully",
    });
  } catch (error) {
    return handleEducationalVideoError(res, error, "Failed to delete educational video", 500);
  }
};