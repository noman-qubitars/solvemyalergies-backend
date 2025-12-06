import mongoose, { Schema, Document } from "mongoose";

export interface IQuestion extends Document {
  questionId?: string;
  questionText: string;
  questionType: "single" | "multi";
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    questionId: { type: String, unique: true, sparse: true },
    questionText: { type: String, required: true },
    questionType: { type: String, enum: ["single", "multi"], required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { collection: "questions" }
);

export const Question = mongoose.model<IQuestion>("Question", QuestionSchema);