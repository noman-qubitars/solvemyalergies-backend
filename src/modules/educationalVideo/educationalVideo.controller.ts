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
import { generateThumbnail, downloadVideoFromS3 } from "../../lib/generateThumbnail";
import {
  initiateMultipartUpload,
  completeMultipartUpload,
  abortMultipartUpload,
} from "../../lib/upload/upload.multipart";
import { deleteFromS3 } from "../../lib/upload/upload.s3";
import { isS3Configured } from "../../config/s3.env";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";

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
    const videoKey = (req.file as any).key || req.file.path;
    
    // For S3 files, download temporarily for processing
    let tempVideoPath: string | null = null;
    let videoPathForProcessing = req.file.path;

    if ((req.file as any).location) {
      try {
        const { downloadVideoFromS3 } = await import("../../lib/generateThumbnail");
        tempVideoPath = await downloadVideoFromS3(videoKey);
        videoPathForProcessing = tempVideoPath;
      } catch (downloadError: any) {
        console.error("Failed to download video from S3 for processing:", downloadError);
      }
    }
    
    let thumbnailUrl;
    try {
      thumbnailUrl = await generateThumbnail(videoPathForProcessing);
      
      // Clean up temp file if it was downloaded from S3
      if (tempVideoPath && (req.file as any).location) {
        try {
          const fs = await import("fs");
          if (fs.existsSync(tempVideoPath)) {
            fs.unlinkSync(tempVideoPath);
          }
        } catch (cleanupError) {
          console.error("Failed to cleanup temp video file:", cleanupError);
        }
      }
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
      // Get S3 URL
      const videoKey = (req.file as any).key || req.file.path;
      let tempVideoPath: string | null = null;
      let videoPathForProcessing = req.file.path;

      if ((req.file as any).location) {
        try {
          const { downloadVideoFromS3 } = await import("../../lib/generateThumbnail");
          tempVideoPath = await downloadVideoFromS3(videoKey);
          videoPathForProcessing = tempVideoPath;
        } catch (downloadError: any) {
          console.error("Failed to download video from S3 for processing:", downloadError);
        }
      }
      
      try {
        const thumbnailUrl = await generateThumbnail(videoPathForProcessing);
        (updateData as any).thumbnailUrl = thumbnailUrl;
        
        // Clean up temp file if it was downloaded from S3
        if (tempVideoPath && (req.file as any).location) {
          try {
            const fs = await import("fs");
            if (fs.existsSync(tempVideoPath)) {
              fs.unlinkSync(tempVideoPath);
            }
          } catch (cleanupError) {
            console.error("Failed to cleanup temp video file:", cleanupError);
          }
        }
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

// Initiate multipart upload for chunked video upload
export const initiateUploadVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { filename, mimetype, totalSize } = req.body;

    if (!filename || !mimetype || !totalSize) {
      return res.status(400).json({
        success: false,
        message: "Filename, mimetype, and totalSize are required",
      });
    }

    const uploadInfo = await initiateMultipartUpload(
      filename,
      mimetype,
      totalSize,
      "videos"
    );

    res.status(200).json({
      success: true,
      message: "Multipart upload initiated successfully",
      data: uploadInfo,
    });
  } catch (error: any) {
    return handleEducationalVideoError(res, error, "Failed to initiate multipart upload", 500);
  }
};

// Complete multipart upload and create video record
export const completeUploadVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { uploadId, key, parts, title, description, status } = req.body;

    if (!uploadId || !key || !parts || !title) {
      return res.status(400).json({
        success: false,
        message: "uploadId, key, parts, and title are required",
      });
    }

    // Complete the multipart upload in S3
    const videoUrl = await completeMultipartUpload(uploadId, key, parts);

    // Download video temporarily for processing (thumbnail)
    let tempVideoPath: string | null = null;
    let thumbnailUrl: string | undefined;

    try {
      // Download from S3 for processing
      tempVideoPath = await downloadVideoFromS3(key);

      // Generate thumbnail
      try {
        thumbnailUrl = await generateThumbnail(tempVideoPath);
      } catch (thumbnailError: any) {
        console.error("⚠️  Failed to generate thumbnail:", thumbnailError.message);
      }
    } catch (downloadError: any) {
      console.error("Failed to download video from S3 for processing:", downloadError);
    } finally {
      // Clean up temp file
      if (tempVideoPath) {
        try {
          if (fs.existsSync(tempVideoPath)) {
            fs.unlinkSync(tempVideoPath);
          }
        } catch (cleanupError) {
          console.error("Failed to cleanup temp video file:", cleanupError);
        }
      }
    }

    // Get file info from S3
    const fileName = key.split('/').pop() || 'video';
    const fileSize = 0; // Could fetch from S3 if needed
    const mimeType = 'video/mp4'; // Default, could be determined from filename

    // Create video record
    const video = await createEducationalVideo({
      title,
      description: description || "",
      videoUrl,
      thumbnailUrl,
      fileName,
      fileSize,
      mimeType,
      status: parseVideoStatus(status) || "uploaded",
    });

    res.status(201).json({
      success: true,
      message: "Educational video uploaded and created successfully",
      data: video,
    });
  } catch (error: any) {
    // Try to abort the upload if completion failed
    try {
      if (req.body.uploadId && req.body.key) {
        await abortMultipartUpload(req.body.uploadId, req.body.key);
      }
    } catch (abortError) {
      console.error("Failed to abort multipart upload:", abortError);
    }

    return handleEducationalVideoError(res, error, "Failed to complete multipart upload", 500);
  }
};

// Initiate multipart upload for updating a video
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

    const uploadInfo = await initiateMultipartUpload(
      filename,
      mimetype,
      totalSize,
      "videos"
    );

    res.status(200).json({
      success: true,
      message: "Multipart upload initiated successfully for update",
      data: uploadInfo,
    });
  } catch (error: any) {
    return handleEducationalVideoError(res, error, "Failed to initiate multipart upload for update", 500);
  }
};

// Complete multipart upload and update video record
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

    // Delete old video from S3 if it exists
    if (existingVideo.videoUrl && isS3Configured()) {
      try {
        await deleteFromS3(existingVideo.videoUrl);
        console.log(`🗑️  Deleted old video from S3: ${existingVideo.videoUrl}`);
      } catch (deleteError: any) {
        console.error("⚠️  Failed to delete old video from S3:", deleteError.message);
        // Continue with update even if deletion fails
      }
    }

    // Delete old thumbnail from S3 if it exists
    if (existingVideo.thumbnailUrl && isS3Configured()) {
      try {
        await deleteFromS3(existingVideo.thumbnailUrl);
        console.log(`🗑️  Deleted old thumbnail from S3: ${existingVideo.thumbnailUrl}`);
      } catch (deleteError: any) {
        console.error("⚠️  Failed to delete old thumbnail from S3:", deleteError.message);
        // Continue with update even if deletion fails
      }
    }

    // Complete the multipart upload in S3
    const videoUrl = await completeMultipartUpload(uploadId, key, parts);

    // Download video temporarily for processing (thumbnail)
    let tempVideoPath: string | null = null;
    let thumbnailUrl: string | undefined;

    try {
      // Download from S3 for processing
      console.log(`📥 Downloading video from S3 for processing: ${key}`);
      tempVideoPath = await downloadVideoFromS3(key);
      console.log(`✅ Video downloaded to: ${tempVideoPath}`);

      // Generate thumbnail
      try {
        console.log("🖼️  Generating thumbnail...");
        thumbnailUrl = await generateThumbnail(tempVideoPath);
        console.log(`✅ Thumbnail generated: ${thumbnailUrl}`);
      } catch (thumbnailError: any) {
        console.error("❌ Failed to generate thumbnail:", thumbnailError.message);
        console.error("Thumbnail error stack:", thumbnailError.stack);
      }
    } catch (downloadError: any) {
      console.error("❌ Failed to download video from S3 for processing:", downloadError.message);
      console.error("Download error stack:", downloadError.stack);
    } finally {
      // Clean up temp file
      if (tempVideoPath) {
        try {
          if (fs.existsSync(tempVideoPath)) {
            fs.unlinkSync(tempVideoPath);
            console.log(`🧹 Cleaned up temp file: ${tempVideoPath}`);
          }
        } catch (cleanupError) {
          console.error("❌ Failed to cleanup temp video file:", cleanupError);
        }
      }
    }

    // Get file info from S3
    const fileName = key.split('/').pop() || 'video';
    const fileSize = 0; // Could fetch from S3 if needed
    const mimeType = 'video/mp4'; // Default, could be determined from filename

    // Prepare update data
    const updateData: any = {
      videoUrl,
      fileName,
      fileSize,
      mimeType,
    };

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) {
      const parsedStatus = parseVideoStatus(status);
      if (parsedStatus) updateData.status = parsedStatus;
    }
    if (thumbnailUrl) updateData.thumbnailUrl = thumbnailUrl;

    // Update video record
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
    try {
      if (req.body.uploadId && req.body.key) {
        await abortMultipartUpload(req.body.uploadId, req.body.key);
      }
    } catch (abortError) {
      console.error("Failed to abort multipart upload:", abortError);
    }

    return handleEducationalVideoError(res, error, "Failed to complete multipart upload for update", 500);
  }
};