import { Response } from "express";

export const sendUserIdNotFoundError = (res: Response) => {
  return res.status(401).json({
    success: false,
    message: "User ID not found in token",
  });
};

export const sendUserIdRequiredError = (res: Response) => {
  return res.status(400).json({
    success: false,
    message: "User ID is required",
  });
};

export const handleRewardsError = (res: Response, error: unknown, defaultMessage: string) => {
  const message = error instanceof Error ? error.message : defaultMessage;
  return res.status(400).json({
    success: false,
    message,
  });
};
