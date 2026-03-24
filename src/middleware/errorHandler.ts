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

  const isProduction = process.env.NODE_ENV === "production";

  const rawMessage =
    typeof err?.message === "string" && err.message.trim() !== ""
      ? err.message
      : "Internal server error";

  const message = statusCode >= 500 && isProduction ? "Internal server error" : rawMessage;

  const payload: any = {
    success: false,
    message,
  };

  if (!isProduction && err?.stack) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};