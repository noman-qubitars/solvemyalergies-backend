import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import os from "os";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, getS3Url, getS3KeyFromUrl } from "./upload/upload.s3";
import { config } from "../config/env";
import { isS3Configured } from "../config/s3.env";

const setFfmpegPath = () => {
  if (process.platform === "win32") {
    const username = os.userInfo().username;
    const ffmpegPath = `C:\\Users\\${username}\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0.1-full_build\\bin\\ffmpeg.exe`;
    
    if (fs.existsSync(ffmpegPath)) {
      ffmpeg.setFfmpegPath(ffmpegPath);
      return true;
    }
  } else if (process.platform === "linux") {
    // On Linux/Ubuntu, try common FFmpeg paths
    const commonPaths = [
      "/usr/bin/ffmpeg",
      "/usr/local/bin/ffmpeg",
      "/opt/ffmpeg/bin/ffmpeg",
    ];
    
    for (const ffmpegPath of commonPaths) {
      if (fs.existsSync(ffmpegPath)) {
        ffmpeg.setFfmpegPath(ffmpegPath);
        console.log(`✅ FFmpeg found at: ${ffmpegPath}`);
        return true;
      }
    }
    
    // If not found, try to use system PATH (ffmpeg should be in PATH if installed)
    console.log("⚠️  FFmpeg path not explicitly set, using system PATH");
    return false;
  }
  return false;
};

export const generateThumbnail = (videoPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      console.log(`🖼️  Starting thumbnail generation for: ${videoPath}`);
      
      // Check if video file exists
      if (!fs.existsSync(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
      }

      setFfmpegPath();
      const videoName = path.basename(videoPath, path.extname(videoPath));
      const thumbnailFilename = `${videoName.replace(/\s+/g, '-')}-${Date.now()}.jpg`;
      const tempDir = os.tmpdir();
      const tempThumbnailPath = path.join(tempDir, thumbnailFilename);

      console.log(`📸 Generating thumbnail to: ${tempThumbnailPath}`);

      ffmpeg(videoPath)
        .screenshots({
          timestamps: [0], // Capture from the start of the video
          filename: thumbnailFilename,
          folder: tempDir,
          size: "320x240"
        })
        .on("start", (commandLine) => {
          console.log(`🎬 FFmpeg command: ${commandLine}`);
        })
        .on("end", async () => {
          try {
            console.log(`✅ Thumbnail generated at: ${tempThumbnailPath}`);
            
            // Check if thumbnail file was created
            if (!fs.existsSync(tempThumbnailPath)) {
              throw new Error("Thumbnail file was not created");
            }

            // Upload to S3 - S3 is required
            if (isS3Configured() && s3Client && config.s3.S3_BUCKET_NAME) {
              console.log("📤 Uploading thumbnail to S3...");
              // Read the generated thumbnail file
              const thumbnailBuffer = fs.readFileSync(tempThumbnailPath);
              console.log(`📦 Thumbnail size: ${thumbnailBuffer.length} bytes`);
              
              // Upload to S3
              const s3Key = `uploads/thumbnails/${thumbnailFilename}`;
              const uploadCommand = new PutObjectCommand({
                Bucket: config.s3.S3_BUCKET_NAME,
                Key: s3Key,
                Body: thumbnailBuffer,
                ContentType: "image/jpeg",
              });
              
              await s3Client.send(uploadCommand);
              console.log(`✅ Thumbnail uploaded to S3: ${s3Key}`);
              
              // Clean up temporary file
              fs.unlinkSync(tempThumbnailPath);
              
              // Return S3 URL
              const thumbnailUrl = getS3Url(s3Key);
              console.log(`✅ Thumbnail URL: ${thumbnailUrl}`);
              resolve(thumbnailUrl);
            } else {
              // S3 is required - throw error if not configured
              fs.unlinkSync(tempThumbnailPath);
              throw new Error("S3 is not configured. Thumbnails must be stored in S3.");
            }
          } catch (error: any) {
            // Clean up temporary file even on error
            if (fs.existsSync(tempThumbnailPath)) {
              fs.unlinkSync(tempThumbnailPath);
            }
            console.error("❌ Thumbnail upload error:", error.message);
            console.error("Error stack:", error.stack);
            reject(new Error(`Failed to process thumbnail: ${error.message}`));
          }
        })
        .on("error", (err: unknown) => {
          const e = err as any;
          console.error("❌ FFmpeg Error:", e?.message || String(err));
          if (e?.code !== undefined) {
            console.error("Error code:", e.code);
          }
          if (e?.stack) {
            console.error("Error stack:", e.stack);
          }
          console.error("⚠️  Make sure FFmpeg is installed on the server:");
          console.error("   Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y ffmpeg");
          console.error("   CentOS/RHEL: sudo yum install -y ffmpeg");
          reject(new Error(`FFmpeg error: ${e?.message || String(err)}`));
        });
    } catch (error: any) {
      console.error("❌ Thumbnail generation setup error:", error.message);
      console.error("Error stack:", error.stack);
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