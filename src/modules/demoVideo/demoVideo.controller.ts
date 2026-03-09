import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { config } from "../../config/env";

export const getDemoVideo = async (req: Request, res: Response) => {
  try {
    const demoVideoUrl = process.env.DEMO_VIDEO_URL;
    const demoThumbnailUrlFromEnv = process.env.DEMO_VIDEO_THUMBNAIL_URL;
    if (demoVideoUrl && String(demoVideoUrl).trim() !== "") {
      const thumbnailUrl =
        demoThumbnailUrlFromEnv && String(demoThumbnailUrlFromEnv).trim() !== ""
          ? String(demoThumbnailUrlFromEnv)
          : String(demoVideoUrl).replace(/\.[^./\\?]+(?=(\?|$))/, ".jpg");

      return res.status(200).json({
        success: true,
        data: {
          videoUrl: demoVideoUrl,
          thumbnailUrl,
        },
      });
    }

    const demoVideoKey = process.env.DEMO_VIDEO_KEY || "uploads/videos/demo-video.mp4";
    const demoThumbnailKey =
      process.env.DEMO_VIDEO_THUMBNAIL_KEY ||
      String(demoVideoKey).replace(/\.[^./\\?]+(?=(\?|$))/, ".jpg");
    const bucketUrl = config.s3.S3_BUCKET_URL;
    const bucketName = config.s3.S3_BUCKET_NAME;
    const region = config.s3.AWS_REGION;

    const resolvedBucketUrl =
      bucketUrl && String(bucketUrl).trim() !== ""
        ? String(bucketUrl).replace(/\/$/, "")
        : bucketName && region
          ? `https://${bucketName}.s3.${region}.amazonaws.com`
          : null;

    if (resolvedBucketUrl) {
      const thumbnailUrl =
        demoThumbnailUrlFromEnv && String(demoThumbnailUrlFromEnv).trim() !== ""
          ? String(demoThumbnailUrlFromEnv)
          : `${resolvedBucketUrl}/${demoThumbnailKey}`;

      return res.status(200).json({
        success: true,
        data: {
          videoUrl: `${resolvedBucketUrl}/${demoVideoKey}`,
          thumbnailUrl,
        },
      });
    }

    const videoPath = path.join(process.cwd(), "uploads", "videos", "demo.mp4");
    const thumbnailPath = path.join(
      process.cwd(),
      "uploads",
      "videos",
      "demo-thumbnail.jpg"
    );
    
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        success: false,
        error: "Demo video not found",
      });
    }

    const videoUrl = "/uploads/videos/demo.mp4";
    const thumbnailUrl = fs.existsSync(thumbnailPath)
      ? "/uploads/videos/demo-thumbnail.jpg"
      : null;

    res.status(200).json({
      success: true,
      data: {
        videoUrl,
        thumbnailUrl,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to get demo video URL",
    });
  }
};