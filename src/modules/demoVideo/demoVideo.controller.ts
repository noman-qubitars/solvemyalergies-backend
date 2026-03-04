import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { config } from "../../config/env";

export const getDemoVideo = async (req: Request, res: Response) => {
  try {
    const demoVideoUrl = process.env.DEMO_VIDEO_URL;
    if (demoVideoUrl && String(demoVideoUrl).trim() !== "") {
      return res.status(200).json({
        success: true,
        data: {
          videoUrl: demoVideoUrl,
        },
      });
    }

    const demoVideoKey = process.env.DEMO_VIDEO_KEY || "uploads/videos/demo-video.mp4";
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
      return res.status(200).json({
        success: true,
        data: {
          videoUrl: `${resolvedBucketUrl}/${demoVideoKey}`,
        },
      });
    }

    const videoPath = path.join(process.cwd(), "uploads", "videos", "demo.mp4");
    
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        success: false,
        error: "Demo video not found",
      });
    }

    const videoUrl = "/uploads/videos/demo.mp4";

    res.status(200).json({
      success: true,
      data: {
        videoUrl,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to get demo video URL",
    });
  }
};