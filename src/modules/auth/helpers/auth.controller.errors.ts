import { Response } from "express";

export const determineErrorStatus = (message: string): number => {
  if (message === "Your password is incorrect" || message === "Invalid OTP code. Please check and try again") {
    return 401;
  }
  
  if (message === "OTP code has expired. Please request a new code" || message === "OTP verification has expired. Please verify OTP again") {
    return 410;
  }
  
  if (message === "Your email is incorrect" || message === "Email not found. Please check your email address") {
    return 404;
  }
  
  if (message === "Please verify OTP first" || message === "No verified OTP found. Please verify OTP first") {
    return 400;
  }
  
  if (message === "Your account has been blocked. Please contact support") {
    return 403;
  }
  
  return 422;
};

export const handleAuthError = (res: Response, error: unknown) => {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status = determineErrorStatus(message);
  return res.status(status).json({ 
    success: false,
    message: message 
  });
};