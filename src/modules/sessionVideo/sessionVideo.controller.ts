import { Request, Response } from "express";
import {
  createSessionVideo,
  getAllSessionVideos,
  getSessionVideoById,
  updateSessionVideo,
  deleteSessionVideo,
} from "./sessionVideo.service";
import { AuthRequest } from "../../middleware/auth";
import { UserAnswer } from "../../models/UserAnswer";
import {
  extractSymptomsFromAnswers,
  matchSymptoms,
} from "./helpers/sessionVideo.controller.utils";
import { parseSymptoms, buildUpdateData } from "./helpers/requestParsing.utils";
import { processMulterVideoFile } from "./helpers/videoProcessing.utils";
import {
  initiateVideoUpload,
  completeChunkedUploadAndCreate,
  completeChunkedUploadAndUpdate,
  abortVideoUpload,
} from "./helpers/chunkedUpload.helpers";
import { deleteVideoFiles } from "./helpers/videoDeletion.utils";
import { addDurationToVideos, addDurationToVideo } from "./helpers/videoDuration.utils";
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
// GET VIDEOS
// ============================================================================

export const getVideos = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const userId = req.userId;

    let queryStatus: "uploaded" | "draft" | undefined = status as "uploaded" | "draft" | undefined;
    if (status === "published") {
      queryStatus = "uploaded";
    }

    if (userId) {
      const userAnswer = await UserAnswer.findOne({ userId });

      if (userAnswer && userAnswer.answers && userAnswer.answers.length > 0) {
        const userSymptoms = extractSymptomsFromAnswers(userAnswer.answers);
        const allVideos = await getAllSessionVideos(queryStatus);

        if (userSymptoms.length > 0) {
          const filteredVideos = allVideos.filter(video => {
            if (video.symptoms.length === 0) return true;
            return matchSymptoms(userSymptoms, video.symptoms);
          });

          const videosWithDuration = await addDurationToVideos(filteredVideos);

          return res.status(200).json({
            success: true,
            data: videosWithDuration,
            total: videosWithDuration.length,
          });
        }
      }
    }

    const videos = await getAllSessionVideos(queryStatus);
    const videosWithDuration = await addDurationToVideos(videos);

    res.status(200).json({
      success: true,
      data: videosWithDuration,
      total: videosWithDuration.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch session videos",
    });
  }
};

// ============================================================================
// GET VIDEO BY ID
// ============================================================================

export const getVideoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const video = await getSessionVideoById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Session video not found",
      });
    }

    const videoWithDuration = await addDurationToVideo(video);

    res.status(200).json({
      success: true,
      data: videoWithDuration,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch session video",
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

// ============================================================================
// CHUNKED UPLOAD - INITIATE
// ============================================================================

export const initiateUploadVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { filename, mimetype, totalSize } = req.body;

    if (!filename || !mimetype || !totalSize) {
      return res.status(400).json({
        success: false,
        message: "Filename, mimetype, and totalSize are required",
      });
    }

    const uploadInfo = await initiateVideoUpload(filename, mimetype, totalSize);

    res.status(200).json({
      success: true,
      message: "Multipart upload initiated successfully",
      data: uploadInfo,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to initiate multipart upload",
    });
  }
};

// ============================================================================
// CHUNKED UPLOAD - COMPLETE (Create)
// ============================================================================

export const completeUploadVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { uploadId, key, parts, title, description, symptoms, status } = req.body;

    if (!uploadId || !key || !parts || !title) {
      return res.status(400).json({
        success: false,
        message: "uploadId, key, parts, and title are required",
      });
    }

    const videoData = await completeChunkedUploadAndCreate({
      uploadId,
      key,
      parts,
      title,
      description,
      symptoms,
      status,
    });

    const video = await createSessionVideo(videoData);

    res.status(201).json({
      success: true,
      message: "Session video uploaded and created successfully",
      data: video,
    });
  } catch (error: any) {
    // Try to abort the upload if completion failed
    if (req.body.uploadId && req.body.key) {
      await abortVideoUpload(req.body.uploadId, req.body.key);
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to complete multipart upload",
    });
  }
};

// ============================================================================
// CHUNKED UPLOAD - INITIATE UPDATE
// ============================================================================

export const initiateUpdateUploadVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { filename, mimetype, totalSize } = req.body;

    // Verify video exists
    const existingVideo = await getSessionVideoById(id);
    if (!existingVideo) {
      return res.status(404).json({
        success: false,
        message: "Session video not found",
      });
    }

    if (!filename || !mimetype || !totalSize) {
      return res.status(400).json({
        success: false,
        message: "Filename, mimetype, and totalSize are required",
      });
    }

    const uploadInfo = await initiateVideoUpload(filename, mimetype, totalSize);

    res.status(200).json({
      success: true,
      message: "Multipart upload initiated successfully for update",
      data: uploadInfo,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to initiate multipart upload for update",
    });
  }
};

// ============================================================================
// CHUNKED UPLOAD - COMPLETE UPDATE
// ============================================================================

export const completeUpdateUploadVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { uploadId, key, parts, title, description, symptoms, status } = req.body;

    if (!uploadId || !key || !parts) {
      return res.status(400).json({
        success: false,
        message: "uploadId, key, and parts are required",
      });
    }

    // Verify video exists
    const existingVideo = await getSessionVideoById(id);
    if (!existingVideo) {
      return res.status(404).json({
        success: false,
        message: "Session video not found",
      });
    }

    const updateData = await completeChunkedUploadAndUpdate(
      { uploadId, key, parts, title, description, symptoms, status },
      existingVideo
    );

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
    // Try to abort the upload if completion failed
    if (req.body.uploadId && req.body.key) {
      await abortVideoUpload(req.body.uploadId, req.body.key);
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to complete multipart upload for update",
    });
  }
};