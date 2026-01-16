import { generateThumbnail, downloadVideoFromS3 } from "../../../lib/generateThumbnail";
import fs from "fs";

export interface ProcessedVideoData {
  thumbnailUrl?: string;
}

/**
 * Processes a video file: generates thumbnail
 * Downloads from S3 if needed and cleans up temp files
 */
export const processVideoFile = async (
  videoPathOrKey: string,
  isS3Key: boolean = false
): Promise<ProcessedVideoData> => {
  let tempVideoPath: string | null = null;
  let videoPathForProcessing = videoPathOrKey;
  const result: ProcessedVideoData = {};

  try {
    // Download from S3 if needed
    if (isS3Key) {
      console.log(`📥 Downloading video from S3 for processing: ${videoPathOrKey}`);
      tempVideoPath = await downloadVideoFromS3(videoPathOrKey);
      if (tempVideoPath) {
        videoPathForProcessing = tempVideoPath;
        console.log(`✅ Video downloaded to: ${tempVideoPath}`);
      }
    }

    // Generate thumbnail
    try {
      console.log("🖼️  Generating thumbnail...");
      result.thumbnailUrl = await generateThumbnail(videoPathForProcessing);
      console.log(`✅ Thumbnail generated: ${result.thumbnailUrl}`);
    } catch (thumbnailError: any) {
      console.error("❌ Failed to generate thumbnail:", thumbnailError.message);
      console.error("Thumbnail error stack:", thumbnailError.stack);
    }
  } catch (downloadError: any) {
    console.error("❌ Failed to download video from S3 for processing:", downloadError.message);
    console.error("Download error stack:", downloadError.stack);
  } finally {
    // Clean up temp file if it was downloaded from S3
    if (tempVideoPath && isS3Key) {
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

  return result;
};

/**
 * Processes a video file from multer upload (handles both S3 and local files)
 */
export const processMulterVideoFile = async (file: Express.Multer.File): Promise<ProcessedVideoData> => {
  const videoKey = (file as any).key || file.path;
  const isS3File = !!(file as any).location;

  if (isS3File) {
    return processVideoFile(videoKey, true);
  } else {
    return processVideoFile(file.path, false);
  }
};