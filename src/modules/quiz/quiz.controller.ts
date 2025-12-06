import { Response } from "express";
import mongoose from "mongoose";
import { Question } from "../../models/Question";
import { UserAnswer } from "../../models/UserAnswer";
import { validate } from "../../lib/validation/validateRequest";
import { answerSchema, updateAnswerSchema } from "./quiz.schemas";
import { AuthRequest } from "../../middleware/auth";

export const submitAnswer = [
  validate(answerSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const { questionId, questionType, selectedOption } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User ID not found in token"
        });
      }

      let question;
      if (mongoose.Types.ObjectId.isValid(questionId)) {
        question = await Question.findById(questionId);
        if (!question) {
          question = await Question.findOne({ questionId: questionId });
        }
      } else {
        question = await Question.findOne({ questionId: questionId });
      }

      if (!question) {
        return res.status(404).json({
          success: false,
          message: "Question not found"
        });
      }

      if (question.questionType !== questionType) {
        return res.status(400).json({
          success: false,
          message: "Question type mismatch"
        });
      }

      let userAnswer = await UserAnswer.findOne({ userId });

      if (!userAnswer) {
        userAnswer = await UserAnswer.create({
          userId,
          answers: [{
            questionId,
            questionType,
            selectedOption
          }]
        });
      } else {
        const existingAnswerIndex = userAnswer.answers.findIndex(
          (ans) => ans.questionId === questionId
        );

        if (existingAnswerIndex !== -1) {
          return res.status(400).json({
            success: false,
            message: "You already save answer for this question."
          });
        }

        userAnswer.answers.push({
          questionId,
          questionType,
          selectedOption
        });

        await userAnswer.save();
      }

      return res.status(201).json({
        success: true,
        message: "Answer saved successfully",
        data: {
          id: userAnswer._id,
          userId: userAnswer.userId,
          answers: userAnswer.answers,
          createdAt: userAnswer.createdAt,
          updatedAt: userAnswer.updatedAt
        }
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error"
      });
    }
  }
];

export const updateAnswer = [
  validate(updateAnswerSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.query;
      const userId = req.userId;
      const { questionId, questionType, selectedOption } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User ID not found in token"
        });
      }

      if (!id || !mongoose.Types.ObjectId.isValid(id as string)) {
        return res.status(400).json({
          success: false,
          message: "Incorrect id"
        });
      }

      const userAnswer = await UserAnswer.findById(id);
      if (!userAnswer) {
        return res.status(404).json({
          success: false,
          message: "Incorrect id"
        });
      }

      if (userAnswer.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "You can only update your own answers"
        });
      }

      let question;
      if (mongoose.Types.ObjectId.isValid(questionId)) {
        question = await Question.findById(questionId);
        if (!question) {
          question = await Question.findOne({ questionId: questionId });
        }
      } else {
        question = await Question.findOne({ questionId: questionId });
      }

      if (!question) {
        return res.status(404).json({
          success: false,
          message: "Question not found"
        });
      }

      if (question.questionType !== questionType) {
        return res.status(400).json({
          success: false,
          message: "Question type mismatch"
        });
      }

      const existingAnswerIndex = userAnswer.answers.findIndex(
        (ans) => ans.questionId === questionId
      );

      if (existingAnswerIndex !== -1) {
        userAnswer.answers[existingAnswerIndex].selectedOption = selectedOption;
        userAnswer.answers[existingAnswerIndex].questionType = questionType;
      } else {
        userAnswer.answers.push({
          questionId,
          questionType,
          selectedOption
        });
      }

      await userAnswer.save();

      return res.status(200).json({
        success: true,
        message: "Answer updated successfully",
        data: {
          id: userAnswer._id,
          userId: userAnswer.userId,
          answers: userAnswer.answers,
          createdAt: userAnswer.createdAt,
          updatedAt: userAnswer.updatedAt
        }
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error"
      });
    }
  }
];

export const getQuestionsWithAnswers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token"
      });
    }

    const userAnswer = await UserAnswer.findOne({ userId });

    if (!userAnswer) {
      return res.status(200).json({
        success: true,
        data: {
          userId: userId,
          answers: []
        }
      });
    }

    const answersWithQuestions = await Promise.all(
      userAnswer.answers.map(async (answer) => {
        let question = null;
        
        if (mongoose.Types.ObjectId.isValid(answer.questionId)) {
          question = await Question.findById(answer.questionId);
          if (!question) {
            question = await Question.findOne({ questionId: answer.questionId });
          }
        } else {
          question = await Question.findOne({ questionId: answer.questionId });
        }

        if (question) {
          return {
            question: {
              id: question._id,
              questionId: question.questionId,
              questionText: question.questionText,
              questionType: question.questionType,
              createdAt: question.createdAt
            },
            selectedOption: answer.selectedOption
          };
        }

        return {
          question: null,
          questionId: answer.questionId,
          selectedOption: answer.selectedOption
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        id: userAnswer._id,
        userId: userAnswer.userId,
        answers: answersWithQuestions,
        createdAt: userAnswer.createdAt,
        updatedAt: userAnswer.updatedAt
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

