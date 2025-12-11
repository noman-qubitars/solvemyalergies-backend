import { Router } from "express";
import { updateProfile, getUserProfile } from "./profile.controller";
import { requireNotRole } from "../../middleware/auth";
import { handleFileUpload, uploadProfileImage } from "../../lib/upload";

const router = Router();

router.get("/", requireNotRole("admin"), getUserProfile);
router.post("/edit", requireNotRole("admin"), handleFileUpload([
  { name: 'image', maxCount: 1 }
], uploadProfileImage), updateProfile);

export { router as profileRouter };
