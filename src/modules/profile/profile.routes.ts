import { Router } from "express";
import { updateProfile, getUserProfile } from "./profile.controller";
import { requireNotRole } from "../../middleware/auth";
import { handleFileUpload, uploadProfileImage } from "../../lib/upload";
import { validate } from "../../lib/validation/validateRequest";
import { editProfileSchema } from "./profile.schemas";

const router = Router();

router.get("/", requireNotRole("admin"), getUserProfile);
router.post(
  "/edit",
  requireNotRole("admin"),
  handleFileUpload([{ name: "image", maxCount: 1 }], uploadProfileImage),
  validate(editProfileSchema),
  updateProfile
);

export { router as profileRouter };