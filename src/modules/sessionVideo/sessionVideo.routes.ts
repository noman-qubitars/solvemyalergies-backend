import { Router } from "express";
import {
  createVideo,
  getVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  initiateUploadVideo,
  completeUploadVideo,
} from "./sessionVideo.controller";
import { authenticate, requireRole, conditionalAuthForVideos } from "../../middleware/auth";
import { uploadVideo } from "../../lib/upload";
import { validate } from "../../lib/validation/validateRequest";
import { initiateUploadSchema, completeUploadSchema } from "./sessionVideo.schemas";

const sessionVideoRouter = Router();

sessionVideoRouter.post("/", authenticate, requireRole("admin"), uploadVideo.single("video"), createVideo);
sessionVideoRouter.post("/initiate-upload", authenticate, requireRole("admin"), validate(initiateUploadSchema), initiateUploadVideo);
sessionVideoRouter.post("/complete-upload", authenticate, requireRole("admin"), validate(completeUploadSchema), completeUploadVideo);
sessionVideoRouter.get("/", conditionalAuthForVideos, getVideos);
sessionVideoRouter.get("/:id", getVideoById);
sessionVideoRouter.put("/:id", authenticate, requireRole("admin"), uploadVideo.single("video"), updateVideo);
sessionVideoRouter.delete("/:id", authenticate, requireRole("admin"), deleteVideo);

export { sessionVideoRouter };