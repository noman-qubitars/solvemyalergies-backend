import { Response } from "express";
import mongoose from "mongoose";
import { Question } from "../../models/Question";
import { UserAnswer } from "../../models/UserAnswer";
import { validate } from "../../lib/validation/validateRequest";
import { answerSchema, updateAnswerSchema } from "./quiz.schemas";
import { AuthRequest } from "../../middleware/auth";

const getQuestionNumber = (questionId: string): number | null => {
  const match = questionId.match(/question_(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

const validateSequentialQuestion = (questionId: string, existingAnswers: Array<{ questionId: string }>): { valid: boolean; missingQuestion?: number } => {
  const currentQuestionNum = getQuestionNumber(questionId);
  if (currentQuestionNum === null) {
    return { valid: true };
  }

  if (currentQuestionNum <= 2) {
    return { valid: true };
  }

  const answeredQuestionNums = existingAnswers
    .map(ans => getQuestionNumber(ans.questionId))
    .filter((num): num is number => num !== null);

  if (!answeredQuestionNums.includes(2)) {
    return { valid: false, missingQuestion: 2 };
  }

  return { valid: true };
};

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
        const currentQuestionNum = getQuestionNumber(questionId);
        if (currentQuestionNum !== null && currentQuestionNum !== 1) {
          return res.status(400).json({
            success: false,
            message: `You must answer question_${currentQuestionNum - 1} first before answering ${questionId}`
          });
        }

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

        const validation = validateSequentialQuestion(questionId, userAnswer.answers);
        if (!validation.valid && validation.missingQuestion) {
          return res.status(400).json({
            success: false,
            message: `You must answer question_${validation.missingQuestion} first before answering ${questionId}`
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
        const validation = validateSequentialQuestion(questionId, userAnswer.answers);
        if (!validation.valid && validation.missingQuestion) {
          return res.status(400).json({
            success: false,
            message: `You must answer question_${validation.missingQuestion} first before answering ${questionId}`
          });
        }

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

export const patchAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.query;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token"
      });
    }

    if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
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

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    
    if (!files || !files.photo || files.photo.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Photo is required"
      });
    }

    // Update photo if provided (multiple images allowed)
    if (files.photo && files.photo.length > 0) {
      const photoPaths = files.photo.map(photoFile => `/uploads/images/${photoFile.filename}`);
      userAnswer.photo = JSON.stringify(photoPaths);
    }

    // Update file if provided (multiple PDFs/documents allowed)
    if (files.file && files.file.length > 0) {
      const filePaths = files.file.map(file => {
        const fileSubfolder = file.mimetype === 'application/pdf' ? 'pdfs' : 'documents';
        return `/uploads/${fileSubfolder}/${file.filename}`;
      });
      userAnswer.file = JSON.stringify(filePaths);
    }

    await userAnswer.save();

    return res.status(200).json({
      success: true,
      message: "Answer updated successfully",
      data: {
        id: userAnswer._id,
        userId: userAnswer.userId,
        answers: userAnswer.answers,
        photo: userAnswer.photo,
        file: userAnswer.file,
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

