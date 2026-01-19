import { Message } from "../../models/Message";
import { User } from "../../models/User";
import { deleteFromS3 } from "../../lib/upload/upload.s3";
import fs from "fs";
import path from "path";

export interface CreateMessageData {
  userId: string;
  adminId?: string;
  messageType: "text" | "voice" | "image" | "document" | "pdf";
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  sentBy: "user" | "admin";
}

export interface GetMessagesParams {
  userId?: string;
  isRead?: boolean;
}

export const createMessage = async (data: CreateMessageData) => {
  const messageData: any = { ...data };
  
  if (data.sentBy === "admin") {
    delete messageData.isRead;
  } else {
    messageData.isRead = false;
  }
  
  const message = await Message.create(messageData);
  return {
    success: true,
    message: "Message sent successfully",
    data: message,
  };
};

export const getMessages = async (params: GetMessagesParams) => {
  const { userId, isRead } = params;

  const query: any = {};

  if (userId) {
    query.userId = userId;
  }

  if (isRead !== undefined) {
    query.sentBy = "user";
    query.isRead = isRead;
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return {
    success: true,
    data: messages,
  };
};

export const getMessagesByUserId = async (userId: string) => {
  const messages = await Message.find({ userId: userId.toString() })
    .sort({ createdAt: 1 })
    .lean();

  return {
    success: true,
    data: messages,
    total: messages.length,
  };
};

export const markMessagesAsRead = async (messageIds: string[], userId?: string) => {
  const query: any = { 
    _id: { $in: messageIds },
    sentBy: "user"
  };
  
  if (userId) {
    query.userId = userId;
  }

  const result = await Message.updateMany(query, {
    $set: { isRead: true, updatedAt: new Date() },
  });

  return {
    success: true,
    message: `${result.modifiedCount} message(s) marked as read`,
    modifiedCount: result.modifiedCount,
  };
};

export const deleteMessage = async (messageId: string, userId?: string) => {
  const query: any = { _id: messageId };
  
  if (userId) {
    query.userId = userId;
  }

  const message = await Message.findOne(query);

  if (!message) {
    throw new Error("Message not found");
  }

  if (message.fileUrl) {
    try {
      if (message.fileUrl.startsWith('http://') || message.fileUrl.startsWith('https://')) {
        await deleteFromS3(message.fileUrl);
      } else {
        const filePath = path.join(process.cwd(), message.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  await Message.deleteOne({ _id: messageId });

  return {
    success: true,
    message: "Message deleted successfully",
  };
};

export const deleteAllMessagesByUserId = async (targetUserId: string, userId?: string) => {
  const query: any = { userId: targetUserId };
  
  const user = userId ? await User.findById(userId) : null;
  const isAdmin = user?.role === "admin";
  
  if (!isAdmin && userId) {
    if (targetUserId !== userId) {
      throw new Error("Unauthorized to delete messages");
    }
  }

  const messages = await Message.find(query);

  for (const message of messages) {
    if (message.fileUrl) {
      try {
        if (message.fileUrl.startsWith('http://') || message.fileUrl.startsWith('https://')) {
          await deleteFromS3(message.fileUrl);
        } else {
          const filePath = path.join(process.cwd(), message.fileUrl);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
  }

  const result = await Message.deleteMany(query);

  return {
    success: true,
    message: `${result.deletedCount} message(s) deleted successfully`,
    deletedCount: result.deletedCount,
  };
};