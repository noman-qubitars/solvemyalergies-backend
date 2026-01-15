import { Router } from "express";
import {
  createVideo,
  getVideos,
  updateVideo,
  deleteVideo,
  initiateUploadVideo,
  completeUploadVideo,
  initiateUpdateUploadVideo,
  completeUpdateUploadVideo,
} from "./educationalVideo.controller";
import {
  toggleFavorite,
  getFavoriteVideos,
} from "./educationalVideo.favorites.controller";
import { authenticate, requireRole, requireNotRole, conditionalAuthForVideos } from "../../middleware/auth";
import { uploadVideo } from "../../lib/upload";
import { validate } from "../../lib/validation/validateRequest";
import { initiateUploadSchema, completeUploadSchema, completeUpdateUploadSchema } from "./educationalVideo.schemas";

const educationalVideoRouter = Router();

educationalVideoRouter.post("/", authenticate, requireRole("admin"), uploadVideo.single("video"), createVideo);
educationalVideoRouter.post("/initiate-upload", authenticate, requireRole("admin"), validate(initiateUploadSchema), initiateUploadVideo);
educationalVideoRouter.post("/complete-upload", authenticate, requireRole("admin"), validate(completeUploadSchema), completeUploadVideo);
educationalVideoRouter.post("/:id/initiate-update-upload", authenticate, requireRole("admin"), validate(initiateUploadSchema), initiateUpdateUploadVideo);
educationalVideoRouter.post("/:id/complete-update-upload", authenticate, requireRole("admin"), validate(completeUpdateUploadSchema), completeUpdateUploadVideo);
educationalVideoRouter.get("/favorites", authenticate, requireNotRole("admin"), getFavoriteVideos);
educationalVideoRouter.get("/", conditionalAuthForVideos, getVideos);
educationalVideoRouter.put("/:id/favorite", authenticate, requireNotRole("admin"), toggleFavorite);
educationalVideoRouter.put("/:id", authenticate, requireRole("admin"), uploadVideo.single("video"), updateVideo);
educationalVideoRouter.delete("/:id", authenticate, requireRole("admin"), deleteVideo);

export { educationalVideoRouter };