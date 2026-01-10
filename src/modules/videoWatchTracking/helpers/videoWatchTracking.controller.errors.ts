import { Response } from "express";

export const sendUserIdNotFoundError = (res: Response) => {
  return res.status(401).json({
    success: false,
    message: "User ID not found in token",
  });
};

export const sendVideoIdRequiredError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Video ID is required",
  });
};

export const sendDayNumberRequiredError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Day number is required",
  });
};

export const sendInvalidDayNumberError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Day number must be an integer between 1 and 42",
  });
};

export const sendPositionRequiredError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Current position is required",
  });
};

export const sendDurationRequiredError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Video duration is required",
  });
};

export const handleVideoWatchError = (res: Response, error: unknown, defaultMessage: string) => {
  const message = error instanceof Error ? error.message : defaultMessage;
  return res.status(400).json({
    success: false,
    message: message,
  });
};