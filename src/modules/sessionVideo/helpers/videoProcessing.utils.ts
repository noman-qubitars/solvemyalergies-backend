import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import { generateThumbnail, downloadVideoFromS3 } from "../../../lib/generateThumbnail";

export interface ProcessedVideoData {
  videoDuration?: number;
  thumbnailUrl?: string;
}

/**
 * Extracts video duration from a video file
 */
export const extractVideoDuration = async (videoPath: string): Promise<number | undefined> => {
  try {
    return await new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          console.error("Error extracting video duration:", err);
          reject(err);
          return;
        }

        // Try to get duration from video stream first (more accurate)
        let duration: number | undefined;
        if (metadata.streams && metadata.streams.length > 0) {
          const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
          if (videoStream && videoStream.duration) {
            duration = parseFloat(videoStream.duration);
          }
        }

        // Fall back to format duration if stream duration not available
        if (!duration || isNaN(duration)) {
          duration = metadata.format.duration;
        }

        if (duration && !isNaN(duration)) {
          // Use Math.ceil to round up to ensure we don't lose any seconds
          // This matches video player behavior better
          resolve(Math.ceil(duration));
        } else {
          reject(new Error("Could not extract video duration"));
        }
      });
    });
  } catch (error: any) {
    console.error("Failed to extract video duration:", error.message);
    return undefined;
  }
};

/**
 * Processes a video file: extracts duration and generates thumbnail
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

    // Extract video duration
    try {
      console.log("⏱️  Extracting video duration...");
      result.videoDuration = await extractVideoDuration(videoPathForProcessing);
      if (result.videoDuration) {
        console.log(`✅ Video duration extracted: ${result.videoDuration} seconds`);
      }
    } catch (error: any) {
      console.error("❌ Failed to extract video duration:", error.message);
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
  const videoUrl = (file as any).location || file.path;
  const videoKey = (file as any).key || file.path;
  const isS3File = !!(file as any).location;

  if (isS3File) {
    return processVideoFile(videoKey, true);
  } else {
    return processVideoFile(file.path, false);
  }
};