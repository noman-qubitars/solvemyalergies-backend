import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import os from "os";

const setFfmpegPath = () => {
  const username = os.userInfo().username;
  const ffmpegPath = `C:\\Users\\${username}\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0.1-full_build\\bin\\ffmpeg.exe`;
  
  if (fs.existsSync(ffmpegPath)) {
    ffmpeg.setFfmpegPath(ffmpegPath);
    return true;
  }
  return false;
};

export const generateThumbnail = (videoPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      setFfmpegPath();
      
      const videoName = path.basename(videoPath, path.extname(videoPath));
      const thumbnailsDir = path.join(process.cwd(), "uploads", "thumbnails");
      
      if (!fs.existsSync(thumbnailsDir)) {
        fs.mkdirSync(thumbnailsDir, { recursive: true });
      }

      const thumbnailFilename = `${videoName.replace(/\s+/g, '-')}.jpg`;

      ffmpeg(videoPath)
        .screenshots({
          timestamps: [0], // Capture from the start of the video
          filename: thumbnailFilename,
          folder: thumbnailsDir,
          size: "320x240"
        })
        .on("end", () => {
          const thumbnailUrl = `/uploads/thumbnails/${encodeURIComponent(thumbnailFilename)}`;
          console.log(`✅ Thumbnail generated successfully: ${thumbnailUrl}`);
          resolve(thumbnailUrl);
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