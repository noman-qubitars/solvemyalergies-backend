import { Response } from "express";
import { getAllSessionVideos } from "./sessionVideo.service";
import { AuthRequest } from "../../middleware/auth";
import { UserAnswer } from "../../models/UserAnswer";
import { DailySession } from "../../models/DailySession";
import {
  extractSymptomsFromAnswers,
  matchSymptoms,
} from "./helpers/sessionVideo.controller.utils";
import { addDurationToVideos } from "./helpers/videoDuration.utils";

// ============================================================================
// GET VIDEOS
// ============================================================================

export const getVideos = async (req: AuthRequest, res: Response) => {
  try {
    const { status, day } = req.query;
    const userId = req.userId;
    const userRole = req.userRole;

    let queryStatus: "uploaded" | "draft" | undefined = status as
      | "uploaded"
      | "draft"
      | undefined;
    if (status === "published") {
      queryStatus = "uploaded";
    }

    // Helper to split videos into core sessions and exercise videos
    const splitVideosByType = (videos: any[]) => {
      const sessions = videos.filter(
        (video) =>
          typeof video.title === "string" &&
          video.title.toLowerCase().includes("session video")
      );
      const exercises = videos.filter(
        (video) =>
          typeof video.title === "string" &&
          video.title.toLowerCase().includes("exercise video")
      );
      return { sessions, exercises };
    };

    const resolveDayForUser = async (): Promise<number | null> => {
      if (day !== undefined && day !== null && String(day).trim() !== "") {
        const parsedDay = Number(day);
        if (!Number.isFinite(parsedDay) || parsedDay <= 0) {
          return null;
        }
        return Math.floor(parsedDay);
      }

      if (!userId) return null;

      const latestSession = await DailySession.findOne({ userId })
        .sort({ day: -1 })
        .select({ day: 1 })
        .lean();

      if (!latestSession || typeof (latestSession as any).day !== "number") {
        return null;
      }

      return (latestSession as any).day;
    };

    const filterVideosForDay = (videos: any[], targetDay: number) => {
      return videos.filter((video) => {
        if (typeof video?.description !== "string") return false;
        const d = video.description.trim();

        const m = /^day\s*(\d+)/i.exec(d);
        if (!m) return false;

        const parsed = Number(m[1]);
        if (!Number.isFinite(parsed)) return false;

        return parsed === targetDay;
      });
    };

    if (userId && userRole !== "admin") {
      const targetDay = await resolveDayForUser();
      if (!targetDay) {
        return res.status(400).json({
          success: false,
          message:
            "Day is required for user requests (provide ?day=1) or submit a daily session first.",
        });
      }

      const userAnswer = await UserAnswer.findOne({ userId });

      const allVideos = await getAllSessionVideos(queryStatus);
      const videosWithDuration = await addDurationToVideos(allVideos);
      const { sessions, exercises } = splitVideosByType(videosWithDuration);

      // For user requests, always return the day's Session Video.
      // Symptom-based personalization should not hide the core session content.
      let candidateExercises = exercises;
      if (userAnswer && userAnswer.answers && userAnswer.answers.length > 0) {
        const userSymptoms = extractSymptomsFromAnswers(userAnswer.answers);
        if (userSymptoms.length > 0) {
          candidateExercises = exercises.filter((video) => {
            if (video.symptoms.length === 0) return true;
            return matchSymptoms(userSymptoms, video.symptoms);
          });
        }
      }

      const daySessions = filterVideosForDay(sessions, targetDay);
      const dayExercises = filterVideosForDay(candidateExercises, targetDay);

      let filteredExercises = dayExercises;
      if (userAnswer && userAnswer.answers && userAnswer.answers.length > 0) {
        const q36Answer = userAnswer.answers.find(
          (ans: any) => ans.questionId === "question_36"
        );
        const frequency =
          typeof q36Answer?.selectedOption === "string"
            ? q36Answer.selectedOption.toLowerCase()
            : null;

        if (frequency === "weekly" || frequency === "daily") {
          filteredExercises = [];
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          sessions: daySessions,
          exercises: filteredExercises,
        },
        total: {
          sessions: daySessions.length,
          exercises: filteredExercises.length,
        },
      });
    }

    const videos = await getAllSessionVideos(queryStatus);
    const videosWithDuration = await addDurationToVideos(videos);

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
