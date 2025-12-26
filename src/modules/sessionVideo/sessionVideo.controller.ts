import { Request, Response } from "express";
import {
  createSessionVideo,
  getAllSessionVideos,
  getSessionVideosBySymptoms,
  getSessionVideoById,
  updateSessionVideo,
  deleteSessionVideo,
} from "./sessionVideo.service";
import { AuthRequest } from "../../middleware/auth";
import { UserAnswer } from "../../models/UserAnswer";
import fs from "fs";
import path from "path";

const extractSymptomsFromAnswers = (answers: any[]): string[] => {
  const symptoms: string[] = [];
  
  const question2Answer = answers.find(ans => ans.questionId === "question_2");
  if (question2Answer && question2Answer.selectedOption) {
    if (Array.isArray(question2Answer.selectedOption)) {
      symptoms.push(...question2Answer.selectedOption);
    } else {
      symptoms.push(question2Answer.selectedOption);
    }
  }

  return symptoms.map(s => s.toLowerCase().trim()).filter(s => s.length > 0);
};

const normalizeSymptom = (symptom: string): string => {
  return symptom.toLowerCase().trim();
};

const matchSymptoms = (userSymptoms: string[], videoSymptoms: string[]): boolean => {
  if (videoSymptoms.length === 0) return true;
  
  const normalizedUserSymptoms = userSymptoms.map(normalizeSymptom);
  const normalizedVideoSymptoms = videoSymptoms.map(normalizeSymptom);
  
  return normalizedVideoSymptoms.some(vs => normalizedUserSymptoms.includes(vs));
};

export const createVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, symptoms, status } = req.body;

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

    let symptomsArray: string[] = [];
    if (symptoms) {
      if (typeof symptoms === 'string') {
        try {
          symptomsArray = JSON.parse(symptoms);
        } catch {
          symptomsArray = symptoms.split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        }
      } else if (Array.isArray(symptoms)) {
        symptomsArray = symptoms;
      }
    }

    const filePath = req.file.path.replace(/\\/g, "/");
    const videoUrl = `/uploads/${filePath.split("uploads/")[1]}`;

    const video = await createSessionVideo({
      title,
      description: description || "",
      videoUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      symptoms: symptomsArray,
      status: status || "uploaded",
    });

    res.status(201).json({
      success: true,
      message: "Session video created successfully",
      data: video,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create session video",
    });
  }
};

export const getVideos = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const userId = req.userId;

    let queryStatus: "uploaded" | "draft" | undefined = status as "uploaded" | "draft" | undefined;
    if (status === "published") {
      queryStatus = "uploaded";
    }

    if (userId) {
      const userAnswer = await UserAnswer.findOne({ userId });
      
      if (userAnswer && userAnswer.answers && userAnswer.answers.length > 0) {
        const userSymptoms = extractSymptomsFromAnswers(userAnswer.answers);
        const allVideos = await getAllSessionVideos(queryStatus);
        
        if (userSymptoms.length > 0) {
          const filteredVideos = allVideos.filter(video => {
            if (video.symptoms.length === 0) return true;
            return matchSymptoms(userSymptoms, video.symptoms);
          });
          
          return res.status(200).json({
            success: true,
            data: filteredVideos,
            total: filteredVideos.length,
          });
        }
      }
    }

    const videos = await getAllSessionVideos(queryStatus);
    res.status(200).json({
      success: true,
      data: videos,
      total: videos.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch session videos",
    });
  }
};

export const getVideoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const video = await getSessionVideoById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Session video not found",
      });
    }

    res.status(200).json({
      success: true,
      data: video,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch session video",
    });
  }
};

export const updateVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, symptoms, status } = req.body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (symptoms !== undefined) {
      if (typeof symptoms === 'string') {
        try {
          updateData.symptoms = JSON.parse(symptoms);
        } catch {
          updateData.symptoms = symptoms.split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        }
      } else if (Array.isArray(symptoms)) {
        updateData.symptoms = symptoms;
      }
    }

    if (req.file) {
      const existingVideo = await getSessionVideoById(id);
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

    const video = await updateSessionVideo(id, updateData);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Session video not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Session video updated successfully",
      data: video,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update session video",
    });
  }
};

export const deleteVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const video = await getSessionVideoById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Session video not found",
      });
    }

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

    await deleteSessionVideo(id);

    res.status(200).json({
      success: true,
      message: "Session video deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete session video",
    });
  }
};

