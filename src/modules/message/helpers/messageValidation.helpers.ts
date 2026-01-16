import { Response } from "express";

/**
 * Validates message type and content
 */
export const validateMessageType = (
  messageType: any,
  content: any,
  res: Response
): { valid: boolean } => {
  if (!messageType) {
    res.status(400).json({
      success: false,
      message: "Message type is required",
    });
    return { valid: false };
  }

  if (messageType === "text" && !content) {
    res.status(400).json({
      success: false,
      message: "Content is required for text messages",
    });
    return { valid: false };
  }

  return { valid: true };
};

/**
 * Validates file requirement for non-text messages
 */
export const validateFileForMessage = (
  messageType: string,
  hasFile: boolean,
  res: Response
): { valid: boolean } => {
  if (messageType !== "text" && !hasFile) {
    res.status(400).json({
      success: false,
      message: "File is required for non-text messages",
    });
    return { valid: false };
  }

  return { valid: true };
};

/**
 * Validates messageIds array
 */
export const validateMessageIds = (
  messageIds: any,
  res: Response
): { valid: boolean } => {
  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    res.status(400).json({
      success: false,
      message: "messageIds array is required",
    });
    return { valid: false };
  }

  return { valid: true };
};

/**
 * Validates userId parameter
 */
export const validateUserId = (
  userId: any,
  res: Response
): { valid: boolean } => {
  if (!userId) {
    res.status(400).json({
      success: false,
      message: "User ID is required",
    });
    return { valid: false };
  }

  return { valid: true };
};

/**
 * Validates messageId parameter
 */
export const validateMessageId = (
  messageId: any,
  res: Response
): { valid: boolean } => {
  if (!messageId) {
    res.status(400).json({
      success: false,
      message: "Message ID is required",
    });
    return { valid: false };
  }

  return { valid: true };
};