import { Response } from "express";
import {
  createSessionVideo,
  getSessionVideoById,
  updateSessionVideo,
} from "./sessionVideo.service";
import { AuthRequest } from "../../middleware/auth";
import {
  initiateVideoUpload,
  completeChunkedUploadAndCreate,
  completeChunkedUploadAndUpdate,
  abortVideoUpload,
} from "./helpers/chunkedUpload.helpers";

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
    const { uploadId, key, parts, title, description, symptoms, status } =
      req.body;

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
    const { uploadId, key, parts, title, description, symptoms, status } =
      req.body;

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
