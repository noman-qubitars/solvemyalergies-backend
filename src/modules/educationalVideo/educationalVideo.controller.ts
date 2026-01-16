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
  buildUpdateData,
} from "./helpers/educationalVideo.controller.utils";
import { processMulterVideoFile } from "./helpers/videoProcessing.utils";
import {
  initiateVideoUpload,
  completeChunkedUploadAndCreate,
  completeChunkedUploadAndUpdate,
  abortVideoUpload,
} from "./helpers/chunkedUpload.helpers";
import { deleteVideoFiles } from "./helpers/videoDeletion.utils";

// ============================================================================
// CREATE VIDEO
// ============================================================================

export const createVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, status } = req.body;

    if (!title) {
      return sendTitleRequiredError(res);
    }

    if (!req.file) {
      return sendVideoFileRequiredError(res);
    }

    // Get S3 URL from multer-s3
    const videoUrl = (req.file as any).location || buildVideoUrl(req.file.path);

    // Process video (thumbnail)
    const processedData = await processMulterVideoFile(req.file);

    const video = await createEducationalVideo({
      title,
      description: description || "",
      videoUrl,
      thumbnailUrl: processedData.thumbnailUrl,
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

// ============================================================================
// GET VIDEOS
// ============================================================================

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

// ============================================================================
// GET VIDEO BY ID
// ============================================================================

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

// ============================================================================
// UPDATE VIDEO (Legacy - direct file upload)
// ============================================================================

export const updateVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    const existingVideo = await getEducationalVideoById(id);
    if (!existingVideo) {
      return sendVideoNotFoundError(res);
    }

    const updateData = buildUpdateData(title, description, status, req.file);

    if (req.file) {
      // Process video (thumbnail)
      const processedData = await processMulterVideoFile(req.file);
      (updateData as any).thumbnailUrl = processedData.thumbnailUrl;
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

// ============================================================================
// DELETE VIDEO
// ============================================================================

export const deleteVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const video = await getEducationalVideoById(id);

    if (!video) {
      return sendVideoNotFoundError(res);
    }

    // Delete video files from storage
    await deleteVideoFiles(video);

    await deleteEducationalVideo(id);

    res.status(200).json({
      success: true,
      message: "Educational video deleted successfully",
    });
  } catch (error) {
    return handleEducationalVideoError(res, error, "Failed to delete educational video", 500);
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
    return handleEducationalVideoError(res, error, "Failed to initiate multipart upload", 500);
  }
};

// ============================================================================
// CHUNKED UPLOAD - COMPLETE (Create)
// ============================================================================

export const completeUploadVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { uploadId, key, parts, title, description, status } = req.body;

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
      status,
    });

    const video = await createEducationalVideo(videoData);

    res.status(201).json({
      success: true,
      message: "Educational video uploaded and created successfully",
      data: video,
    });
  } catch (error: any) {
    // Try to abort the upload if completion failed
    if (req.body.uploadId && req.body.key) {
      await abortVideoUpload(req.body.uploadId, req.body.key);
    }

    return handleEducationalVideoError(res, error, "Failed to complete multipart upload", 500);
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
    const existingVideo = await getEducationalVideoById(id);
    if (!existingVideo) {
      return sendVideoNotFoundError(res);
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
    return handleEducationalVideoError(res, error, "Failed to initiate multipart upload for update", 500);
  }
};

// ============================================================================
// CHUNKED UPLOAD - COMPLETE UPDATE
// ============================================================================

export const completeUpdateUploadVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { uploadId, key, parts, title, description, status } = req.body;

    if (!uploadId || !key || !parts) {
      return res.status(400).json({
        success: false,
        message: "uploadId, key, and parts are required",
      });
    }

    // Verify video exists
    const existingVideo = await getEducationalVideoById(id);
    if (!existingVideo) {
      return sendVideoNotFoundError(res);
    }

    const updateData = await completeChunkedUploadAndUpdate(
      { uploadId, key, parts, title, description, status },
      existingVideo
    );

    const video = await updateEducationalVideo(id, updateData);

    if (!video) {
      return sendVideoNotFoundError(res);
    }

    res.status(200).json({
      success: true,
      message: "Educational video updated successfully",
      data: video,
    });
  } catch (error: any) {
    // Try to abort the upload if completion failed
    if (req.body.uploadId && req.body.key) {
      await abortVideoUpload(req.body.uploadId, req.body.key);
    }

    return handleEducationalVideoError(res, error, "Failed to complete multipart upload for update", 500);
  }
};
