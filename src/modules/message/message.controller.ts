import { Request, Response } from "express";
import {
  createMessage,
  getMessages,
  getMessagesByUserId,
  markMessagesAsRead,
  deleteMessage,
  deleteAllMessagesByUserId,
} from "./message.service";
import { AuthRequest } from "../../middleware/auth";
import { User } from "../../models/User";
import { getSocketInstance } from "../../lib/socketInstance";

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const user = await User.findById(userId);
    const isAdmin = user?.role === "admin" || req.userRole === "admin";
    const { content, messageType } = req.body;

    if (!messageType) {
      return res.status(400).json({
        success: false,
        message: "Message type is required",
      });
    }

    if (messageType === "text" && !content) {
      return res.status(400).json({
        success: false,
        message: "Content is required for text messages",
      });
    }

    let fileUrl: string | undefined;
    let fileName: string | undefined;
    let fileSize: number | undefined;
    let mimeType: string | undefined;

    if (req.file) {
      const filePath = req.file.path.replace(/\\/g, "/");
      fileUrl = `/uploads/${filePath.split("uploads/")[1]}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;
      mimeType = req.file.mimetype;
    }

    if (messageType !== "text" && !req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required for non-text messages",
      });
    }

    const targetUserId = isAdmin ? (req.body.userId || userId) : userId!;
    
    const result = await createMessage({
      userId: targetUserId,
      adminId: isAdmin ? userId : undefined,
      messageType,
      content,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      sentBy: isAdmin ? "admin" : "user",
    });

    const io = getSocketInstance();
    if (io && result.data) {
      io.to(`user:${targetUserId}`).emit("new_message", result.data);
      io.to("admins").emit("new_message", result.data);
      if (!isAdmin) {
        io.to(`user:${userId}`).emit("new_message", result.data);
      }
    }

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to send message",
    });
  }
};

export const getAllMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, isRead } = req.query;
    const isAdmin = req.userRole === "admin";

    const params: any = {};
    
    if (isAdmin) {
      if (userId) params.userId = userId as string;
    } else {
      params.userId = req.userId;
    }
    
    if (isRead !== undefined) params.isRead = isRead === "true";

    const result = await getMessages(params);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch messages",
    });
  }
};

export const getUserMessages = async (req: AuthRequest, res: Response) => {
  try {
    let userId: string | undefined;
    
    if (req.params.userId) {
      userId = req.params.userId;
    } else if (req.userId) {
      userId = req.userId;
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const userIdString = userId.toString();
    const result = await getMessagesByUserId(userIdString);
    
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch messages",
    });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { messageIds } = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "messageIds array is required",
      });
    }

    const result = await markMessagesAsRead(messageIds);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to mark messages as read",
    });
  }
};

export const deleteMessageById = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId!;
    const user = await User.findById(userId);
    const isAdmin = user?.role === "admin" || req.userRole === "admin";

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: "Message ID is required",
      });
    }

    const result = await deleteMessage(messageId, isAdmin ? undefined : userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete message",
    });
  }
};

export const deleteAllMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { userId: targetUserId } = req.body;
    const userId = req.userId!;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const result = await deleteAllMessagesByUserId(targetUserId, userId);
    
    const io = getSocketInstance();
    if (io) {
      io.to(`user:${targetUserId}`).emit("chat_deleted", { userId: targetUserId });
      io.to("admins").emit("chat_deleted", { userId: targetUserId });
    }

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete chat",
    });
  }
};

