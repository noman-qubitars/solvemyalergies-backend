import { Response } from "express";

export const sendVideoNotFoundError = (res: Response) => {
  return res.status(404).json({
    success: false,
    message: "Educational video not found",
  });
};

export const sendVideoAlreadyInFavoritesError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Video is already in favorites",
  });
};

export const sendVideoNotInFavoritesError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "Video is not in favorites",
  });
};

export const sendUserIdNotFoundError = (res: Response) => {
  return res.status(401).json({
    success: false,
    message: "User ID not found in token",
  });
};

export const handleFavoriteError = (res: Response, error: unknown, defaultMessage: string) => {
  const message = error instanceof Error ? error.message : defaultMessage;
  const statusCode = message.includes("not found") ? 404 : 400;
  return res.status(statusCode).json({
    success: false,
    message: message,
  });
};