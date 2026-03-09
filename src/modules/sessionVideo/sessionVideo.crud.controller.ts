import { Response } from "express";
import {
  createSessionVideo,
  getSessionVideoById,
  updateSessionVideo,
  deleteSessionVideo,
} from "./sessionVideo.service";
import { AuthRequest } from "../../middleware/auth";
import { parseSymptoms, buildUpdateData } from "./helpers/requestParsing.utils";
import { processMulterVideoFile } from "./helpers/videoProcessing.utils";
import { deleteVideoFiles } from "./helpers/videoDeletion.utils";
import fs from "fs";
import path from "path";

// ============================================================================
// CREATE VIDEO
// ============================================================================

export const createVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, symptoms, status } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Video file is required",
      });
    }

    const symptomsArray = parseSymptoms(symptoms);

    // Get S3 URL from multer-s3 (location property) or fallback to key/path
    const videoUrl = (req.file as any).location || req.file.path;

    // Process video (duration and thumbnail)
    const processedData = await processMulterVideoFile(req.file);

    const video = await createSessionVideo({
      title,
      description: description || "",
      videoUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      symptoms: symptomsArray,
      status: status || "uploaded",
      videoDuration: processedData.videoDuration,
      thumbnailUrl: processedData.thumbnailUrl,
    });

    res.status(201).json({
      success: true,
      message: "Session video created successfully",
      data: video,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create session video",
    });
  }
};

// ============================================================================
// UPDATE VIDEO (Legacy - direct file upload)
// ============================================================================

export const updateVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existingVideo = await getSessionVideoById(id);

    if (!existingVideo) {
      return res.status(404).json({
        success: false,
        message: "Session video not found",
      });
    }

    const updateData = buildUpdateData(req.body);

    if (req.file) {
      // Get S3 URL from multer-s3
      const videoUrl = (req.file as any).location || req.file.path;

      updateData.videoUrl = videoUrl;
      updateData.fileName = req.file.originalname;
      updateData.fileSize = req.file.size;
      updateData.mimeType = req.file.mimetype;

      // Process video (duration and thumbnail)
      const processedData = await processMulterVideoFile(req.file);
      updateData.videoDuration = processedData.videoDuration;
      updateData.thumbnailUrl = processedData.thumbnailUrl;

      // Delete old thumbnail if exists (local file)
      if (existingVideo?.thumbnailUrl && !(req.file as any).location) {
        const oldThumbnailPath = path.join(
          process.cwd(),
          "uploads",
          existingVideo.thumbnailUrl.replace("/uploads/", "")
        );
        if (fs.existsSync(oldThumbnailPath)) {
          fs.unlinkSync(oldThumbnailPath);
        }
      }
    }

    const video = await updateSessionVideo(id, updateData);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Session video not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Session video updated successfully",
      data: video,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update session video",
    });
  }
};

// ============================================================================
// DELETE VIDEO
// ============================================================================

export const deleteVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const video = await getSessionVideoById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Session video not found",
      });
    }

    // Delete video files from storage
    await deleteVideoFiles(video);

    await deleteSessionVideo(id);

    res.status(200).json({
      success: true,
      message: "Session video deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete session video",
    });
  }
};
