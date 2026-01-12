import mongoose, { Schema, Document } from "mongoose";

export interface AnswerItem {
  questionId: string;
  questionType: "single" | "multi";
  selectedOption: string | string[];
}

export interface IUserAnswer extends Document {
  userId: string;
  answers: AnswerItem[];
  photo?: string;
  file?: string;
  assignedSessions?: string[];
  sessionAssignments?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AnswerItemSchema = new Schema({
  questionId: { type: String, required: true },
  questionType: { type: String, enum: ["single", "multi"], required: true },
  selectedOption: { type: Schema.Types.Mixed, required: true }
}, { _id: false });

const UserAnswerSchema = new Schema<IUserAnswer>(
  {
    userId: { type: String, required: true, unique: true },
    answers: { type: [AnswerItemSchema], default: [] },
    photo: { type: String },
    file: { type: String },
    assignedSessions: { type: [String], default: [] },
    sessionAssignments: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { collection: "userAnswers" }
);

UserAnswerSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

export const UserAnswer = mongoose.model<IUserAnswer>("UserAnswer", UserAnswerSchema);