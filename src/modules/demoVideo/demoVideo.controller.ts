import { Request, Response } from "express";
import path from "path";
import fs from "fs";

export const getDemoVideo = async (req: Request, res: Response) => {
  try {
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
