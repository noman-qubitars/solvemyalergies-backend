import { deleteFromS3 } from "../../../lib/upload/upload.s3";
import { isS3Configured } from "../../../config/s3.env";
import { buildFilePath, deleteFileIfExists } from "./educationalVideo.controller.utils";

/**
 * Deletes a video and its thumbnail from storage (S3 or local)
 */
export const deleteVideoFiles = async (video: {
  videoUrl?: string;
  thumbnailUrl?: string;
}): Promise<void> => {
  // Delete from S3 if configured
  if (isS3Configured()) {
    try {
      // Delete video from S3
      if (video.videoUrl) {
        await deleteFromS3(video.videoUrl);
        console.log(`🗑️  Deleted video from S3: ${video.videoUrl}`);
      }

      // Delete thumbnail from S3 if exists
      if (video.thumbnailUrl) {
        try {
          await deleteFromS3(video.thumbnailUrl);
          console.log(`🗑️  Deleted thumbnail from S3: ${video.thumbnailUrl}`);
        } catch (thumbnailError) {
          console.error("Failed to delete thumbnail from S3:", thumbnailError);
          // Continue even if thumbnail deletion fails
        }
      }
    } catch (s3Error) {
      console.error("Failed to delete video from S3:", s3Error);
      // Continue with local deletion fallback even if S3 deletion fails
    }
  }

  // Fallback to local file deletion if S3 is not configured or S3 deletion failed
  if (video.videoUrl && !video.videoUrl.startsWith('http')) {
    const filePath = buildFilePath(video.videoUrl);
    deleteFileIfExists(filePath);
  }

  if (video.thumbnailUrl && !video.thumbnailUrl.startsWith('http')) {
    const thumbnailPath = buildFilePath(video.thumbnailUrl);
    deleteFileIfExists(thumbnailPath);
  }
};