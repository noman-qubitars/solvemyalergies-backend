import { Response } from "express";

export const handleControllerError = (error: unknown, res: Response) => {
  if (error instanceof Error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export const sendUserNotFoundError = (res: Response) => {
  return res.status(404).json({
    success: false,
    message: "User not found",
  });
};

export const sendUserIdNotFoundError = (res: Response) => {
  return res.status(401).json({
    success: false,
    message: "User ID not found in token",
  });
};

export const sendCannotBlockAdminError = (res: Response) => {
  return res.status(403).json({
    success: false,
    message: "Cannot block admin accounts",
  });
};