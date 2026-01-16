import { Response } from "express";

export const sendUserIdNotFoundError = (res: Response) => {
  return res.status(401).json({
    success: false,
    message: "User ID not found in token"
  });
};

export const sendImageRequiredError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Image is required"
  });
};

export const handleProfileError = (res: Response, error: unknown) => {
  const message = error instanceof Error ? error.message : "Internal server error";
  return res.status(500).json({
    success: false,
    message: message
  });
};