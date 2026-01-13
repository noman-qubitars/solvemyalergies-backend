import mongoose from "mongoose";
import { Question } from "../../../models/Question";
import { AnswerItem } from "../../../models/UserAnswer";

export const findQuestionForAnswer = async (answer: AnswerItem) => {
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
        createdAt: question.createdAt,
      },
      selectedOption: answer.selectedOption,
    };
  }

  return {
    question: null,
    questionId: answer.questionId,
    selectedOption: answer.selectedOption,
  };
};