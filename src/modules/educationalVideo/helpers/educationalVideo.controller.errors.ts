import { Response } from "express";

export const sendTitleRequiredError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Title is required",
  });
};

export const sendVideoFileRequiredError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Video file is required",
  });
};

export const sendInvalidPageNumberError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Invalid page number",
  });
};

export const sendInvalidPageSizeError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Invalid page size",
  });
};

export const sendVideoNotFoundError = (res: Response) => {
  return res.status(404).json({
    success: false,
    message: "Educational video not found",
  });
};

export const handleEducationalVideoError = (res: Response, error: unknown, defaultMessage: string, statusCode: number = 500) => {
  const message = error instanceof Error ? error.message : defaultMessage;
  return res.status(statusCode).json({
    success: false,
    message: message,
  });
};