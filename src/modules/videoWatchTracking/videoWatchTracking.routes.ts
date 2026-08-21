import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import {
  trackVideo,
  getStatus,
  syncVideoTracking,
} from "./videoWatchTracking.controller";

const router = Router();

router.put("/track", authenticate, trackVideo);
router.post("/sync", authenticate, syncVideoTracking);
router.get("/status", authenticate, getStatus);

export { router as videoWatchTrackingRouter };