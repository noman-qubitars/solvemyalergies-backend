import { Request, Response } from "express";
import {
  createEducationalVideo,
  getAllEducationalVideos,
  getEducationalVideoById,
  updateEducationalVideo,
  deleteEducationalVideo,
} from "./educationalVideo.service";
import { AuthRequest } from "../../middleware/auth";
import fs from "fs";
import path from "path";

export const createVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, status } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Video file is required",
      });
    }

    const filePath = req.file.path.replace(/\\/g, "/");
    const videoUrl = `/uploads/${filePath.split("uploads/")[1]}`;

    const video = await createEducationalVideo({
      title,
      description: description || "",
      videoUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: status || "uploaded",
    });

    res.status(201).json({
      success: true,
      message: "Educational video created successfully",
      data: video,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create educational video",
    });
  }
};

export const getVideos = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    // Map "published" to "uploaded" for mobile app compatibility
    let queryStatus: "uploaded" | "draft" | undefined = status as "uploaded" | "draft" | undefined;
    if (status === "published") {
      queryStatus = "uploaded";
    }
    const videos = await getAllEducationalVideos(queryStatus);

    res.status(200).json({
      success: true,
      data: videos,
      total: videos.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch educational videos",
    });
  }
};

export const getVideoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const video = await getEducationalVideoById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Educational video not found",
      });
    }

    res.status(200).json({
      success: true,
      data: video,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch educational video",
    });
  }
};

export const updateVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    if (req.file) {
      // Delete old file if exists
      const existingVideo = await getEducationalVideoById(id);
      if (existingVideo?.videoUrl) {
        const oldFilePath = path.join(
          process.cwd(),
          "uploads",
          existingVideo.videoUrl.replace("/uploads/", "")
        );
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      const filePath = req.file.path.replace(/\\/g, "/");
      updateData.videoUrl = `/uploads/${filePath.split("uploads/")[1]}`;
      updateData.fileName = req.file.originalname;
      updateData.fileSize = req.file.size;
      updateData.mimeType = req.file.mimetype;
    }

    const video = await updateEducationalVideo(id, updateData);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Educational video not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Educational video updated successfully",
      data: video,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update educational video",
    });
  }
};

export const deleteVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const video = await getEducationalVideoById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Educational video not found",
      });
    }

    // Delete file from filesystem
    if (video.videoUrl) {
      const filePath = path.join(
        process.cwd(),
        "uploads",
        video.videoUrl.replace("/uploads/", "")
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await deleteEducationalVideo(id);

    res.status(200).json({
      success: true,
      message: "Educational video deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete educational video",
    });
  }
};

