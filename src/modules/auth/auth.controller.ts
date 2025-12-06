import { Request, Response } from "express";
import { signin as signinService, requestPasswordReset, resendOtp as resendOtpService, verifyOtp as verifyOtpService, resetPassword as resetPasswordService } from "./auth.service";
import { signinSchema, forgotPasswordSchema, verifyOtpSchema, resetPasswordSchema } from "./auth.schemas";
import { validate } from "../../lib/validation/validateRequest";

const determineStatus = (message: string) => {
  // 401 - Unauthorized: Wrong password, Incorrect OTP
  if (message === "Your password is incorrect" || message === "Invalid OTP code. Please check and try again") {
    return 401;
  }
  
  // 410 - Gone: Expired OTP
  if (message === "OTP code has expired. Please request a new code" || message === "OTP verification has expired. Please verify OTP again") {
    return 410;
  }
  
  // 404 - Not Found: User not found
  if (message === "Your email is incorrect" || message === "Email not found. Please check your email address") {
    return 404;
  }
  
  // 400 - Bad Request: Invalid input, validation errors
  if (message === "Please verify OTP first" || message === "No verified OTP found. Please verify OTP first") {
    return 400;
  }
  
  // 403 - Forbidden: Account blocked
  if (message === "Your account has been blocked. Please contact support") {
    return 403;
  }
  
  return 422;
};

const handleError = (res: Response, error: unknown) => {
  const message = error instanceof Error ? error.message : "Unexpected error";
  res.status(determineStatus(message)).json({ 
    success: false,
    message: message 
  });
};

export const signin = [
  validate(signinSchema),
  async (req: Request, res: Response) => {
  try {
    const result = await signinService(req.body);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
  }
];

export const forgotPassword = [
  validate(forgotPasswordSchema),
  async (req: Request, res: Response) => {
  try {
    const result = await requestPasswordReset(req.body.email);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
  }
];

export const verifyOtp = [
  validate(verifyOtpSchema),
  async (req: Request, res: Response) => {
  try {
      const code = req.body.code || req.body.otp;
      const result = await verifyOtpService(req.body.email, code);
      res.status(200).json(result);
    } catch (error) {
      handleError(res, error);
    }
  }
];

export const resetPassword = [
  validate(resetPasswordSchema),
  async (req: Request, res: Response) => {
    try {
      const result = await resetPasswordService({
        email: req.body.email,
        password: req.body.password
      });
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
  }
];

export const resendOtp = [
  validate(forgotPasswordSchema),
  async (req: Request, res: Response) => {
  try {
      const result = await resendOtpService(req.body.email);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
  }
];