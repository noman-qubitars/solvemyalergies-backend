import { Router } from "express";
import { signin, googleSignIn, refreshToken, forgotPassword, verifyOtp, resetPassword, resendOtp } from "./auth.controller";
import { signinSchema, googleSignInSchema, refreshTokenSchema, forgotPasswordSchema, verifyOtpSchema, resetPasswordSchema } from "./auth.schemas";
import { validate } from "../../lib/validation/validateRequest";

const router = Router();

router.post("/signin", validate(signinSchema), signin);
router.post("/google", validate(googleSignInSchema), googleSignIn);
router.post("/refresh-token", validate(refreshTokenSchema), refreshToken);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/resend-otp", validate(forgotPasswordSchema), resendOtp);
router.post("/otp", validate(verifyOtpSchema), verifyOtp);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

export { router as authRouter };