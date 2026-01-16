import {
  initiateMultipartUpload,
  completeMultipartUpload,
  abortMultipartUpload,
} from "../../../lib/upload/upload.multipart";
import { deleteFromS3 } from "../../../lib/upload/upload.s3";
import { isS3Configured } from "../../../config/s3.env";
import { processVideoFile } from "./videoProcessing.utils";
import { parseVideoStatus } from "./educationalVideo.controller.utils";

export interface ChunkedUploadCreateParams {
  uploadId: string;
  key: string;
  parts: Array<{ partNumber: number; etag: string }>;
  title: string;
  description?: string;
  status?: "uploaded" | "draft";
}

export interface ChunkedUploadUpdateParams {
  uploadId: string;
  key: string;
  parts: Array<{ partNumber: number; etag: string }>;
  title?: string;
  description?: string;
  status?: "uploaded" | "draft";
}

/**
 * Initiates a multipart upload for videos
 */
export const initiateVideoUpload = async (
  filename: string,
  mimetype: string,
  totalSize: number
) => {
  return await initiateMultipartUpload(filename, mimetype, totalSize, "videos");
};

/**
 * Completes a chunked upload and creates a video record
 */
export const completeChunkedUploadAndCreate = async (params: ChunkedUploadCreateParams) => {
  const { uploadId, key, parts, title, description, status } = params;

  // Complete the multipart upload in S3
  const videoUrl = await completeMultipartUpload(uploadId, key, parts);

  // Process video (thumbnail)
  const processedData = await processVideoFile(key, true);

  // Get file info from S3
  const fileName = key.split('/').pop() || 'video';
  const fileSize = 0; // Could fetch from S3 if needed
  const mimeType = 'video/mp4'; // Default, could be determined from filename

  return {
    title,
    description: description || "",
    videoUrl,
    thumbnailUrl: processedData.thumbnailUrl,
    fileName,
    fileSize,
    mimeType,
    status: parseVideoStatus(status) || "uploaded",
  };
};

/**
 * Completes a chunked upload and updates a video record
 */
export const completeChunkedUploadAndUpdate = async (
  params: ChunkedUploadUpdateParams,
  existingVideo: { videoUrl?: string; thumbnailUrl?: string }
) => {
  const { uploadId, key, parts, title, description, status } = params;

  // Delete old video and thumbnail from S3 if they exist
  if (existingVideo.videoUrl && isS3Configured()) {
    try {
      await deleteFromS3(existingVideo.videoUrl);
      console.log(`🗑️  Deleted old video from S3: ${existingVideo.videoUrl}`);
    } catch (deleteError: any) {
      console.error("⚠️  Failed to delete old video from S3:", deleteError.message);
      // Continue with update even if deletion fails
    }
  }

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

  // Process video (thumbnail)
  const processedData = await processVideoFile(key, true);

  // Get file info from S3
  const fileName = key.split('/').pop() || 'video';
  const fileSize = 0; // Could fetch from S3 if needed
  const mimeType = 'video/mp4'; // Default, could be determined from filename

  // Build update data
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
  if (processedData.thumbnailUrl) updateData.thumbnailUrl = processedData.thumbnailUrl;

  return updateData;
};

/**
 * Aborts a multipart upload (used in error handling)
 */
export const abortVideoUpload = async (uploadId: string, key: string) => {
  try {
    await abortMultipartUpload(uploadId, key);
  } catch (abortError) {
    console.error("Failed to abort multipart upload:", abortError);
  }
};