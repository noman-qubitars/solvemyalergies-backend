import { Schema, Document } from "mongoose";

export interface IVideoWatchTracking {
  userId: string;
  videoId: string;
  dayNumber: number;
  watchProgress: number; // Percentage 0-100
  isCompleted: boolean;
  watchedDuration: number; // Seconds watched
  videoDuration: number; // Total video duration in seconds
  lastPosition: number; // Last playback position in seconds
  maxWatchedPosition: number; // Maximum position ever reached (for resume)
  hasSkippedForward: boolean; // True if user skipped forward
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVideoWatchTrackingDocument extends IVideoWatchTracking, Document {}

export const VideoWatchTrackingSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    videoId: { type: String, required: true, index: true },
    dayNumber: { type: Number, required: true, min: 1, max: 42 },
    watchProgress: { type: Number, required: true, min: 0, max: 100, default: 0 },
    isCompleted: { type: Boolean, default: false, index: true },
    watchedDuration: { type: Number, default: 0 }, // Total seconds watched
    videoDuration: { type: Number, required: true }, // Total video duration
    lastPosition: { type: Number, default: 0 }, // Last playback position
    maxWatchedPosition: { type: Number, default: 0 }, // Maximum position ever reached
    hasSkippedForward: { type: Boolean, default: false },
    completedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "videowatchtrackings" }
);

// Compound index to ensure one tracking per user per day per video
VideoWatchTrackingSchema.index({ userId: 1, dayNumber: 1, videoId: 1 }, { unique: true });
VideoWatchTrackingSchema.index({ userId: 1, dayNumber: 1, isCompleted: 1 });

VideoWatchTrackingSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});