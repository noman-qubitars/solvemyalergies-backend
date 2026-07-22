import { Request, Response } from "express";
import { signin as signinService, googleSignIn as googleSignInService, refreshAccessToken as refreshAccessTokenService, requestPasswordReset, resendOtp as resendOtpService, verifyOtp as verifyOtpService, resetPassword as resetPasswordService } from "./auth.service";
import { handleAuthError } from "./helpers/auth.controller.errors";
import { extractOtpCode } from "./helpers/auth.controller.utils";

export const signin = async (req: Request, res: Response) => {
  try {
    const result = await signinService(req.body);
    res.status(200).json(result);
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const googleSignIn = async (req: Request, res: Response) => {
  try {
    const result = await googleSignInService(req.body.idToken);
    res.status(200).json(result);
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const result = await refreshAccessTokenService(req.body.refreshToken);
    res.status(200).json(result);
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const result = await requestPasswordReset(req.body.email);
    res.status(200).json(result);
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const code = extractOtpCode(req.body);
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "OTP code is required"
      });
    }
    const result = await verifyOtpService(req.body.email, code);
    res.status(200).json(result);
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const result = await resetPasswordService({
      email: req.body.email,
      password: req.body.password
    });
    res.status(200).json(result);
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const result = await resendOtpService(req.body.email);
    res.status(200).json(result);
  } catch (error) {
    handleAuthError(res, error);
  }
};