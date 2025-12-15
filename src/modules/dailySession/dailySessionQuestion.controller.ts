import { Request, Response } from "express";
import { DailySessionQuestion } from "../../models/DailySessionQuestion";

export const getDailySessionQuestions = async (_req: Request, res: Response) => {
  try {
    const questions = await DailySessionQuestion.find()
      .sort({ order: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: questions,
      total: questions.length,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch daily session questions",
    });
  }
};