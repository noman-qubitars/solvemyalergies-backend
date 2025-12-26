import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  userId: string;
  adminId?: string;
  messageType: "text" | "voice" | "image" | "document" | "pdf";
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  isRead?: boolean;
  sentBy: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    userId: { type: String, required: true, ref: "User" },
    adminId: { type: String, ref: "User" },
    messageType: {
      type: String,
      enum: ["text", "voice", "image", "document", "pdf"],
      required: true,
    },
    content: { type: String },
    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
    isRead: { type: Boolean, default: false, required: false },
    sentBy: { type: String, enum: ["user", "admin"], required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "messages" }
);

MessageSchema.index({ userId: 1, createdAt: -1 });
MessageSchema.index({ isRead: 1 });

export const Message = mongoose.model<IMessage>("Message", MessageSchema);