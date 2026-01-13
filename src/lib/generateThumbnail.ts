import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import os from "os";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, getS3Url, getS3KeyFromUrl } from "./upload/upload.s3";
import { config } from "../config/env";
import { isS3Configured } from "../config/s3.env";

const setFfmpegPath = () => {
  // For Linux/EC2, ffmpeg should be in PATH
  // For Windows development, keep the existing logic
  if (process.platform === "win32") {
    const username = os.userInfo().username;
    const ffmpegPath = `C:\\Users\\${username}\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0.1-full_build\\bin\\ffmpeg.exe`;
    
    if (fs.existsSync(ffmpegPath)) {
      ffmpeg.setFfmpegPath(ffmpegPath);
      return true;
    }
  }
  return false;
};

export const generateThumbnail = (videoPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      setFfmpegPath();
      
      const videoName = path.basename(videoPath, path.extname(videoPath));
      const thumbnailFilename = `${videoName.replace(/\s+/g, '-')}-${Date.now()}.jpg`;
      
      // Create temporary directory for thumbnail
      const tempDir = os.tmpdir();
      const tempThumbnailPath = path.join(tempDir, thumbnailFilename);

      ffmpeg(videoPath)
        .screenshots({
          timestamps: [0], // Capture from the start of the video
          filename: thumbnailFilename,
          folder: tempDir,
          size: "320x240"
        })
        .on("end", async () => {
          try {
            // If S3 is configured, upload to S3, otherwise save locally
            if (isS3Configured() && s3Client && config.s3.S3_BUCKET_NAME) {
              // Read the generated thumbnail file
              const thumbnailBuffer = fs.readFileSync(tempThumbnailPath);
              
              // Upload to S3
              const s3Key = `uploads/thumbnails/${thumbnailFilename}`;
              const uploadCommand = new PutObjectCommand({
                Bucket: config.s3.S3_BUCKET_NAME,
                Key: s3Key,
                Body: thumbnailBuffer,
                ContentType: "image/jpeg",
                ACL: "public-read",
              });
              
              await s3Client.send(uploadCommand);
              
              // Clean up temporary file
              fs.unlinkSync(tempThumbnailPath);
              
              // Return S3 URL
              const thumbnailUrl = getS3Url(s3Key);
              console.log(`✅ Thumbnail generated and uploaded to S3: ${thumbnailUrl}`);
              resolve(thumbnailUrl);
            } else {
              // Save locally
              const thumbnailsDir = path.join(process.cwd(), "uploads", "thumbnails");
              if (!fs.existsSync(thumbnailsDir)) {
                fs.mkdirSync(thumbnailsDir, { recursive: true });
              }
              const localThumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
              fs.renameSync(tempThumbnailPath, localThumbnailPath);
              const thumbnailUrl = `/uploads/thumbnails/${encodeURIComponent(thumbnailFilename)}`;
              console.log(`✅ Thumbnail generated successfully: ${thumbnailUrl}`);
              resolve(thumbnailUrl);
            }
          } catch (error: any) {
            // Clean up temporary file even on error
            if (fs.existsSync(tempThumbnailPath)) {
              fs.unlinkSync(tempThumbnailPath);
            }
            console.error("❌ Thumbnail generation error:", error.message);
            reject(new Error(`Failed to process thumbnail: ${error.message}`));
          }
        })
        .on("error", (err) => {
          console.error("❌ FFmpeg Error:", err.message);
          console.error("Make sure FFmpeg is installed: https://ffmpeg.org/download.html");
          reject(new Error(`FFmpeg error: ${err.message}`));
        });
    } catch (error: any) {
      console.error("❌ Thumbnail generation error:", error.message);
      reject(error);
    }
  });
};

// Helper function to download video from S3 temporarily for processing
export const downloadVideoFromS3 = async (s3KeyOrUrl: string): Promise<string> => {
  if (!isS3Configured() || !s3Client || !config.s3.S3_BUCKET_NAME) {
    // If S3 is not configured, assume it's a local path
    return s3KeyOrUrl;
  }
  
  const s3Key = getS3KeyFromUrl(s3KeyOrUrl);
  const tempDir = os.tmpdir();
  const tempVideoPath = path.join(tempDir, `temp-video-${Date.now()}-${path.basename(s3Key)}`);
  
  const getObjectCommand = new GetObjectCommand({
    Bucket: config.s3.S3_BUCKET_NAME,
    Key: s3Key,
  });
  
  const response = await s3Client.send(getObjectCommand);
  const videoStream = response.Body as NodeJS.ReadableStream;
  const writeStream = fs.createWriteStream(tempVideoPath);
  
  return new Promise((resolve, reject) => {
    videoStream.pipe(writeStream);
    writeStream.on("finish", () => resolve(tempVideoPath));
    writeStream.on("error", reject);
  });
};