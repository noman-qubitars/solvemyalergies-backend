import fs from "fs";
import path from "path";
import { deleteFromS3 } from "../../../lib/upload/upload.s3";
import { isS3Configured } from "../../../config/s3.env";

/**
 * Deletes a video and its thumbnail from storage (S3 or local)
 */
export const deleteVideoFiles = async (video: {
  videoUrl?: string;
  thumbnailUrl?: string;
}): Promise<void> => {
  if (!video.videoUrl) {
    return;
  }

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
  } else if (video.videoUrl) {
    // Fallback to local file deletion if S3 is not configured
    const filePath = path.join(
      process.cwd(),
      "uploads",
      video.videoUrl.replace("/uploads/", "")
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};