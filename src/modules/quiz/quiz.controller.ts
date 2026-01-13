import { Response } from "express";
import mongoose from "mongoose";
import { Question } from "../../models/Question";
import { UserAnswer } from "../../models/UserAnswer";
import { validate } from "../../lib/validation/validateRequest";
import { answerSchema, updateAnswerSchema } from "./quiz.schemas";
import { AuthRequest } from "../../middleware/auth";
import {
  findQuestion,
  calculateAndAssignSessions,
  safeJsonParse,
} from "./helpers/quiz.controller.utils";
import {
  validateUserId,
  validateObjectId,
  validateUserOwnership,
  validateFirstQuestion,
  validateQuestionSequence,
  validateAnswerNotExists,
} from "./helpers/quiz.controller.validators";
import {
  sendAnswerSuccessResponse,
  sendPatchAnswerSuccessResponse,
  sendSessionCalculationResponse,
  sendErrorResponse,
  sendInternalErrorResponse,
} from "./helpers/quiz.controller.responses";
import {
  processPhotoFiles,
  processFileUploads,
} from "./helpers/quiz.controller.fileUtils";
import { findQuestionForAnswer } from "./helpers/quiz.controller.questionUtils";

export const submitAnswer = [
  validate(answerSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const { questionId, questionType, selectedOption } = req.body;

      if (!validateUserId(userId, res)) return;

      const question = await findQuestion(questionId);
      if (!question) {
        return sendErrorResponse(res, 404, "Question not found");
      }

      if (question.questionType !== questionType) {
        return sendErrorResponse(res, 400, "Question type mismatch");
      }

      let userAnswer = await UserAnswer.findOne({ userId });

      if (!userAnswer) {
        if (!validateFirstQuestion(questionId, res)) return;

        userAnswer = await UserAnswer.create({
          userId,
          answers: [{ questionId, questionType, selectedOption }],
        });
      } else {
        const existingAnswerIndex = userAnswer.answers.findIndex(
          (ans) => ans.questionId === questionId
        );

        if (!validateAnswerNotExists(existingAnswerIndex, res)) return;

        if (!validateQuestionSequence(questionId, userAnswer.answers, res))
          return;

        userAnswer.answers.push({ questionId, questionType, selectedOption });
        await userAnswer.save();
      }

      await calculateAndAssignSessions(userAnswer);
      sendAnswerSuccessResponse(res, userAnswer, 201);
    } catch (error: any) {
      sendInternalErrorResponse(res, error);
    }
  },
];

export const updateAnswer = [
  validate(updateAnswerSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.query;
      const userId = req.userId;
      const { questionId, questionType, selectedOption } = req.body;

      if (!validateUserId(userId, res)) return;
      if (!validateObjectId(id as string, res)) return;
      
      // TypeScript now knows userId is defined after validation
      const validatedUserId = userId as string;

      const userAnswer = await UserAnswer.findById(id);
      if (!userAnswer) {
        return sendErrorResponse(res, 404, "Incorrect id");
      }

      if (!validateUserOwnership(userAnswer, validatedUserId, res)) return;

      const question = await findQuestion(questionId);
      if (!question) {
        return sendErrorResponse(res, 404, "Question not found");
      }

      if (question.questionType !== questionType) {
        return sendErrorResponse(res, 400, "Question type mismatch");
      }

      const existingAnswerIndex = userAnswer.answers.findIndex(
        (ans) => ans.questionId === questionId
      );

      if (existingAnswerIndex !== -1) {
        userAnswer.answers[existingAnswerIndex].selectedOption = selectedOption;
        userAnswer.answers[existingAnswerIndex].questionType = questionType;
      } else {
        if (!validateQuestionSequence(questionId, userAnswer.answers, res))
          return;

        userAnswer.answers.push({ questionId, questionType, selectedOption });
      }

      await userAnswer.save();
      await calculateAndAssignSessions(userAnswer);
      sendAnswerSuccessResponse(res, userAnswer, 200);
    } catch (error: any) {
      sendInternalErrorResponse(res, error);
    }
  },
];

export const patchAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.query;
    const userId = req.userId;

    if (!validateUserId(userId, res)) return;
    if (!validateObjectId(id as string, res)) return;
    
    // TypeScript now knows userId is defined after validation
    const validatedUserId = userId as string;

    const userAnswer = await UserAnswer.findById(id);
    if (!userAnswer) {
      return sendErrorResponse(res, 404, "Incorrect id");
    }

    if (!validateUserOwnership(userAnswer, validatedUserId, res)) return;

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    } | undefined;

    if (!files || !files.photo || files.photo.length === 0) {
      return sendErrorResponse(res, 400, "Photo is required");
    }

    if (files.photo && files.photo.length > 0) {
      const photoUrls = await processPhotoFiles(files);
      userAnswer.photo = JSON.stringify(photoUrls);
    }

    if (files.file && files.file.length > 0) {
      const fileUrls = await processFileUploads(files);
      userAnswer.file = JSON.stringify(fileUrls);
    }

    await userAnswer.save();
    sendPatchAnswerSuccessResponse(res, userAnswer);
  } catch (error: any) {
    sendInternalErrorResponse(res, error);
  }
};

export const calculateSessions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!validateUserId(userId, res)) return;

    const userAnswer = await UserAnswer.findOne({ userId });

    if (!userAnswer || !userAnswer.answers || userAnswer.answers.length === 0) {
      return sendErrorResponse(
        res,
        400,
        "No answers found. Please complete the quiz first."
      );
    }

    await calculateAndAssignSessions(userAnswer);
    sendSessionCalculationResponse(res, userAnswer);
  } catch (error: any) {
    sendInternalErrorResponse(res, error);
  }
};

export const getQuestionsWithAnswers = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.userId;

    if (!validateUserId(userId, res)) return;

    const userAnswer = await UserAnswer.findOne({ userId });

    if (!userAnswer) {
      return res.status(200).json({
        success: true,
        data: {
          userId: userId,
          answers: [],
        },
      });
    }

    const answersWithQuestions = await Promise.all(
      userAnswer.answers.map(findQuestionForAnswer)
    );

    const photoArray = safeJsonParse(userAnswer.photo);
    const fileArray = safeJsonParse(userAnswer.file);

    res.status(200).json({
      success: true,
      data: {
        id: userAnswer._id,
        userId: userAnswer.userId,
        answers: answersWithQuestions,
        photo: photoArray,
        file: fileArray,
        createdAt: userAnswer.createdAt,
        updatedAt: userAnswer.updatedAt,
      },
    });
  } catch (error: any) {
    sendInternalErrorResponse(res, error);
  }
};