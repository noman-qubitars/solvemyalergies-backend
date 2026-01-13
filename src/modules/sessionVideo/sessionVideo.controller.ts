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
import { VideoWatchTrackingModel } from "../../models/VideoWatchTracking";
import { SessionVideo } from "../../models/SessionVideo";
import { generateThumbnail, downloadVideoFromS3 } from "../../lib/generateThumbnail";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import {
  extractSymptomsFromAnswers,
  matchSymptoms,
  formatDuration,
} from "./helpers/sessionVideo.controller.utils";

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

    // Get S3 URL from multer-s3 (location property) or fallback to key/path
    const videoUrl = (req.file as any).location || req.file.path;
    const videoKey = (req.file as any).key || req.file.path;

    // For S3 files, we need to download temporarily for ffmpeg processing
    let tempVideoPath: string | null = null;
    let videoPathForProcessing = req.file.path;

    // Check if file is in S3 (has location property)
    if ((req.file as any).location) {
      try {
        // Download from S3 to temp file for processing
        tempVideoPath = await downloadVideoFromS3(videoKey);
        if (tempVideoPath) {
          videoPathForProcessing = tempVideoPath;
        }
      } catch (downloadError: any) {
        console.error("Failed to download video from S3 for processing:", downloadError);
        // Continue with original path as fallback
      }
    }

    // Extract video duration
    let videoDuration: number | undefined;
    try {
      videoDuration = await new Promise<number>((resolve, reject) => {
        ffmpeg.ffprobe(videoPathForProcessing, (err, metadata) => {
          if (err) {
            console.error("Error extracting video duration:", err);
            reject(err);
          } else {
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
          }
        });
      });
    } catch (error) {
      console.error("Failed to extract video duration:", error);
      // Continue without duration - it can be set later when video is watched
      videoDuration = undefined;
    }

    // Generate thumbnail using the processing path
    let thumbnailUrl: string | undefined;
    try {
      thumbnailUrl = await generateThumbnail(videoPathForProcessing);
    } catch (thumbnailError: any) {
      console.error("⚠️  Failed to generate thumbnail:", thumbnailError.message);
      console.error("Video uploaded successfully but without thumbnail.");
    }

    // Clean up temp file if it was downloaded from S3
    if (tempVideoPath && (req.file as any).location) {
      try {
        const fs = await import("fs");
        if (fs.existsSync(tempVideoPath)) {
          fs.unlinkSync(tempVideoPath);
        }
      } catch (cleanupError) {
        console.error("Failed to cleanup temp video file:", cleanupError);
      }
    }

    const video = await createSessionVideo({
      title,
      description: description || "",
      videoUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      symptoms: symptomsArray,
      status: status || "uploaded",
      videoDuration,
      thumbnailUrl,
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

    // Helper function to add videoDuration to videos
    const addVideoDurationToVideos = async (videos: any[]) => {
      const videosWithDuration = await Promise.all(
        videos.map(async (video) => {
          const videoObj = video.toObject ? video.toObject() : video;
          
          // First check if videoDuration is stored in SessionVideo model
          let durationInSeconds = videoObj.videoDuration;
          
          // If not, get videoDuration from VideoWatchTracking (any user's tracking for this video)
          if (!durationInSeconds) {
            const tracking = await VideoWatchTrackingModel.findOne({ videoId: video._id.toString() })
              .select('videoDuration')
              .sort({ createdAt: -1 }) // Get the most recent tracking
              .lean();
            
            // If tracking found, update SessionVideo with duration for future queries
            if (tracking?.videoDuration) {
              durationInSeconds = tracking.videoDuration;
              await SessionVideo.findByIdAndUpdate(video._id, { videoDuration: tracking.videoDuration });
            }
          }
          
          return {
            ...videoObj,
            videoDuration: formatDuration(durationInSeconds),
          };
        })
      );
      return videosWithDuration;
    };

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
          
          const videosWithDuration = await addVideoDurationToVideos(filteredVideos);
          
          return res.status(200).json({
            success: true,
            data: videosWithDuration,
            total: videosWithDuration.length,
          });
        }
      }
    }

    const videos = await getAllSessionVideos(queryStatus);
    const videosWithDuration = await addVideoDurationToVideos(videos);
    
    res.status(200).json({
      success: true,
      data: videosWithDuration,
      total: videosWithDuration.length,
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

    const videoObj = video.toObject ? video.toObject() : video;
    
    // First check if videoDuration is stored in SessionVideo model
    let videoDuration = videoObj.videoDuration;
    
    // If not, get videoDuration from VideoWatchTracking
    if (!videoDuration) {
      const tracking = await VideoWatchTrackingModel.findOne({ videoId: id })
        .select('videoDuration')
        .sort({ createdAt: -1 })
        .lean();
      
      if (tracking?.videoDuration) {
        videoDuration = tracking.videoDuration;
        // Update SessionVideo with duration for future queries
        await SessionVideo.findByIdAndUpdate(id, { videoDuration: tracking.videoDuration });
      }
    }
    
    const videoWithDuration = {
      ...videoObj,
      videoDuration: formatDuration(videoDuration),
    };

    res.status(200).json({
      success: true,
      data: videoWithDuration,
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

    // Fetch existing video to get old thumbnail URL
    const existingVideo = await getSessionVideoById(id);
    if (!existingVideo) {
      return res.status(404).json({
        success: false,
        message: "Session video not found",
      });
    }

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
      // Get S3 URL from multer-s3
      const videoUrl = (req.file as any).location || req.file.path;
      const videoKey = (req.file as any).key || req.file.path;
      
      updateData.videoUrl = videoUrl;
      updateData.fileName = req.file.originalname;
      updateData.fileSize = req.file.size;
      updateData.mimeType = req.file.mimetype;

      // For S3 files, download temporarily for processing
      let tempVideoPath: string | null = null;
      let videoPathForProcessing = req.file.path;

      if ((req.file as any).location) {
        try {
          tempVideoPath = await downloadVideoFromS3(videoKey);
          if (tempVideoPath) {
            videoPathForProcessing = tempVideoPath;
          }
        } catch (downloadError: any) {
          console.error("Failed to download video from S3 for processing:", downloadError);
        }
      }

      // Extract video duration from new video file
      try {
        const videoDuration = await new Promise<number>((resolve, reject) => {
          ffmpeg.ffprobe(videoPathForProcessing, (err, metadata) => {
            if (err) {
              console.error("Error extracting video duration:", err);
              reject(err);
            } else {
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
            }
          });
        });
        updateData.videoDuration = videoDuration;
      } catch (error) {
        console.error("Failed to extract video duration:", error);
        // Continue without duration - it can be set later when video is watched
      }

      // Generate thumbnail for new video file
      try {
        // Delete old thumbnail if exists
        if (existingVideo?.thumbnailUrl) {
          const oldThumbnailPath = path.join(
            process.cwd(),
            "uploads",
            existingVideo.thumbnailUrl.replace("/uploads/", "")
          );
          if (fs.existsSync(oldThumbnailPath)) {
            fs.unlinkSync(oldThumbnailPath);
          }
        }
        
        const thumbnailUrl = await generateThumbnail(videoPathForProcessing);
        
        // Clean up temp file if it was downloaded from S3
        if (tempVideoPath && (req.file as any).location) {
          try {
            if (fs.existsSync(tempVideoPath)) {
              fs.unlinkSync(tempVideoPath);
            }
          } catch (cleanupError) {
            console.error("Failed to cleanup temp video file:", cleanupError);
          }
        }
        updateData.thumbnailUrl = thumbnailUrl;
      } catch (thumbnailError: any) {
        console.error("⚠️  Failed to generate thumbnail:", thumbnailError.message);
        console.error("Video updated successfully but without thumbnail.");
      }
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