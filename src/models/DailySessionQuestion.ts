import mongoose, { Schema, Document } from "mongoose";

export interface IDailySessionQuestion extends Document {
  questionId: string;
  questionText: string;
  questionType: "single" | "multi" | "rating" | "text";
  order: number;
  createdAt: Date;
}

const DailySessionQuestionSchema = new Schema<IDailySessionQuestion>(
  {
    questionId: { type: String, required: true, unique: true },
    questionText: { type: String, required: true },
    questionType: { type: String, enum: ["single", "multi", "rating", "text"], required: true },
    order: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { collection: "dailysessionquestions" }
);

export const DailySessionQuestion = mongoose.model<IDailySessionQuestion>("DailySessionQuestion", DailySessionQuestionSchema);

