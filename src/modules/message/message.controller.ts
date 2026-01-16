import { Response } from "express";
import {
  createMessage,
  getMessages,
  getMessagesByUserId,
  markMessagesAsRead,
  deleteMessage,
  deleteAllMessagesByUserId,
} from "./message.service";
import { AuthRequest } from "../../middleware/auth";
import { validateMessageType, validateFileForMessage, validateMessageIds, validateUserId, validateMessageId } from "./helpers/messageValidation.helpers";
import { extractFileInfo } from "./helpers/fileProcessing.helpers";
import { emitNewMessage, emitChatDeleted } from "./helpers/socketNotification.helpers";
import { checkIsAdmin, getTargetUserId, buildGetMessagesParams, extractUserId } from "./helpers/requestParsing.helpers";

// ============================================================================
// SEND MESSAGE
// ============================================================================

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const isAdmin = await checkIsAdmin(userId, req.userRole);
    const { content, messageType } = req.body;

    // Validate message type and content
    const typeValidation = validateMessageType(messageType, content, res);
    if (!typeValidation.valid) {
      return;
    }

    // Extract file info if file is uploaded
    const fileInfo = await extractFileInfo(req.file);

    // Validate file requirement for non-text messages
    const fileValidation = validateFileForMessage(messageType, !!req.file, res);
    if (!fileValidation.valid) {
      return;
    }

    const targetUserId = getTargetUserId(isAdmin, userId, req.body.userId);
    
    const result = await createMessage({
      userId: targetUserId,
      adminId: isAdmin ? userId : undefined,
      messageType,
      content,
      ...fileInfo,
      sentBy: isAdmin ? "admin" : "user",
    });

    // Emit socket notification
    emitNewMessage(result.data, targetUserId, userId, isAdmin);

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to send message",
    });
  }
};

// ============================================================================
// GET ALL MESSAGES
// ============================================================================

export const getAllMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, isRead } = req.query;
    const isAdmin = req.userRole === "admin";

    const params = buildGetMessagesParams(isAdmin, req.userId, userId as string | undefined, isRead as string | undefined);

    const result = await getMessages(params);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch messages",
    });
  }
};

// ============================================================================
// GET USER MESSAGES
// ============================================================================

export const getUserMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = extractUserId(req.params.userId, req.userId);

    const userIdValidation = validateUserId(userId, res);
    if (!userIdValidation.valid) {
      return;
    }

    const userIdString = userId!.toString();
    const result = await getMessagesByUserId(userIdString);
    
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch messages",
    });
  }
};

// ============================================================================
// MARK AS READ
// ============================================================================

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { messageIds } = req.body;

    const idsValidation = validateMessageIds(messageIds, res);
    if (!idsValidation.valid) {
      return;
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

// ============================================================================
// DELETE MESSAGE BY ID
// ============================================================================

export const deleteMessageById = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId!;
    const isAdmin = await checkIsAdmin(userId, req.userRole);

    const idValidation = validateMessageId(messageId, res);
    if (!idValidation.valid) {
      return;
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

// ============================================================================
// DELETE ALL MESSAGES
// ============================================================================

export const deleteAllMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { userId: targetUserId } = req.body;
    const userId = req.userId!;

    const userIdValidation = validateUserId(targetUserId, res);
    if (!userIdValidation.valid) {
      return;
    }

    const result = await deleteAllMessagesByUserId(targetUserId, userId);
    
    // Emit socket notification
    emitChatDeleted(targetUserId);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete chat",
    });
  }
};