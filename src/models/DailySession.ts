import mongoose, { Schema, Document } from "mongoose";

export interface IDailySession extends Document {
  userId: string;
  date: Date;
  answers: {
    questionId: string;
    answer: string | number;
  }[];
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DailySessionSchema = new Schema<IDailySession>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    answers: [
      {
        questionId: { type: String, required: true },
        answer: { type: Schema.Types.Mixed, required: true },
      },
    ],
    feedback: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "dailysessions" }
);

DailySessionSchema.index({ userId: 1, date: 1 }, { unique: true });

DailySessionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const DailySession = mongoose.model<IDailySession>("DailySession", DailySessionSchema);

