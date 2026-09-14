import { UserAnswer } from "../../models/UserAnswer";
import { SessionVideo } from "../../models/SessionVideo";
import { VideoWatchTrackingModel } from "../../models/VideoWatchTracking";

const SYMPTOMS_QUESTION_ID = "question_2"; // "Please select top 3 symptoms that apply to you"

export interface ActivePlan {
  symptom: string;
  totalSessions: number;
  completedSessions: number;
}

export const getUserActivePlans = async (userId: string): Promise<ActivePlan[]> => {
  const userAnswer = await UserAnswer.findOne({ userId });
  if (!userAnswer) {
    return [];
  }

  const symptomsAnswer = userAnswer.answers.find((a) => a.questionId === SYMPTOMS_QUESTION_ID);
  if (!symptomsAnswer) {
    return [];
  }

  const symptoms = Array.isArray(symptomsAnswer.selectedOption)
    ? symptomsAnswer.selectedOption
    : [symptomsAnswer.selectedOption];

  const plans = await Promise.all(
    symptoms.map(async (symptom): Promise<ActivePlan> => {
      const videos = await SessionVideo.find({ status: "uploaded", symptoms: symptom });
      const videoIds = videos.map((v) => v._id.toString());

      const completedSessions = videoIds.length
        ? await VideoWatchTrackingModel.countDocuments({
            userId,
            videoId: { $in: videoIds },
            isCompleted: true,
          })
        : 0;

      return {
        symptom,
        totalSessions: videos.length,
        completedSessions,
      };
    })
  );

  return plans;
};
