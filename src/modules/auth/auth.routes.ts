import { Router } from "express";
import { signin, forgotPassword, verifyOtp, resetPassword, resendOtp } from "./auth.controller";

const router = Router();

router.post("/signin", signin);
router.post("/forgot-password", forgotPassword);
router.post("/resend-otp", resendOtp);
router.post("/otp", verifyOtp);
router.post("/reset-password", resetPassword);

export { router as authRouter };