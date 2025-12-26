import { Schema } from "mongoose";

export interface IUserSession {
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const UserSessionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date },
    duration: { type: Number },
    isActive: { type: Boolean, default: true, index: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { collection: "usersessions" }
);

UserSessionSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 1000);
  }
  next();
});