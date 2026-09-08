import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import os from "os";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, getS3Url, getS3KeyFromUrl } from "./upload/upload.s3";
import { config } from "../config/env";
import { isS3Configured } from "../config/s3.env";
import { setFfmpegPath, downloadVideoFromS3 } from "./generateThumbnail";

interface ConvertedAudio {
  fileUrl: string;
  fileName: string;
  mimeType: string;
}

// Converts a webm audio file (S3 URL/key) to m4a (AAC) and re-uploads it to S3.
// Used because iOS/React Native cannot play webm audio.
export const convertWebmToM4a = (webmFileUrl: string, originalFilename: string): Promise<ConvertedAudio> => {
  return new Promise((resolve, reject) => {
    let tempInputPath: string | undefined;
    let tempOutputPath: string | undefined;

    const cleanup = () => {
      try {
        if (tempInputPath && fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
        if (tempOutputPath && fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
      } catch (cleanupError) {
        console.error("⚠️  Failed to clean up temp audio files:", cleanupError);
      }
    };

    (async () => {
      try {
        if (!isS3Configured() || !s3Client || !config.s3.S3_BUCKET_NAME) {
          throw new Error("S3 is not configured. Converted audio must be stored in S3.");
        }

        setFfmpegPath();
        tempInputPath = await downloadVideoFromS3(webmFileUrl);

        const baseName = path.basename(originalFilename, path.extname(originalFilename)).replace(/\s+/g, "-");
        const outputFilename = `${baseName}-${Date.now()}.m4a`;
        tempOutputPath = path.join(os.tmpdir(), outputFilename);

        ffmpeg(tempInputPath)
          .audioCodec("aac")
          .toFormat("ipod") // ipod = m4a container in ffmpeg
          .on("start", (commandLine) => {
            console.log(`🎙️  FFmpeg audio conversion command: ${commandLine}`);
          })
          .on("error", (err: unknown) => {
            const e = err as any;
            console.error("❌ FFmpeg audio conversion error:", e?.message || String(err));
            cleanup();
            reject(new Error(`FFmpeg audio conversion error: ${e?.message || String(err)}`));
          })
          .on("end", async () => {
            try {
              const fileBuffer = fs.readFileSync(tempOutputPath!);
              const s3Key = `uploads/voice/${outputFilename}`;

              await s3Client!.send(
                new PutObjectCommand({
                  Bucket: config.s3.S3_BUCKET_NAME,
                  Key: s3Key,
                  Body: fileBuffer,
                  ContentType: "audio/mp4",
                })
              );

              try {
                const originalKey = getS3KeyFromUrl(webmFileUrl);
                await s3Client!.send(
                  new DeleteObjectCommand({
                    Bucket: config.s3.S3_BUCKET_NAME,
                    Key: originalKey,
                  })
                );
              } catch (deleteError) {
                console.error("⚠️  Failed to delete original webm file from S3:", deleteError);
              }

              console.log(`✅ Voice message converted to m4a: ${s3Key}`);

              resolve({
                fileUrl: getS3Url(s3Key),
                fileName: outputFilename,
                mimeType: "audio/mp4",
              });
            } catch (uploadError: any) {
              reject(uploadError);
            } finally {
              cleanup();
            }
          })
          .save(tempOutputPath);
      } catch (error: any) {
        cleanup();
        reject(error);
      }
    })();
  });
};
