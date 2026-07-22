import { z } from "zod";

export const signinSchema = z.object({
  email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
  password: z.string().min(1, "Password is required")
});

export const googleSignInSchema = z.object({
  idToken: z.string().min(1, "idToken is required")
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken is required")
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address").min(1, "Email is required")
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
  code: z.string().regex(/^\d{4}$/, "OTP code must be exactly 4 digits").optional(),
  otp: z.string().regex(/^\d{4}$/, "OTP code must be exactly 4 digits").optional()
}).refine((data) => data.code || data.otp, {
  message: "OTP code is required",
  path: ["otp"]
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters long")
});