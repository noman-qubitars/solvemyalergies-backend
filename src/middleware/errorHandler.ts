import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode =
    typeof err?.statusCode === "number" && err.statusCode >= 400
      ? err.statusCode
      : 500;

  const message =
    typeof err?.message === "string" && err.message.trim() !== ""
      ? err.message
      : "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
  });
};