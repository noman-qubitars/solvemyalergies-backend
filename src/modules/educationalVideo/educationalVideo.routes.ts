import { Router } from "express";
import {
  createVideo,
  getVideos,
  updateVideo,
  deleteVideo,
} from "./educationalVideo.controller";
import { authenticate, requireRole, conditionalAuthForVideos } from "../../middleware/auth";
import { uploadVideo } from "../../lib/upload";

const educationalVideoRouter = Router();

educationalVideoRouter.post("/", authenticate, requireRole("admin"), uploadVideo.single("video"), createVideo);
educationalVideoRouter.get("/", conditionalAuthForVideos, getVideos);
educationalVideoRouter.put("/:id", authenticate, requireRole("admin"), uploadVideo.single("video"), updateVideo);
educationalVideoRouter.delete("/:id", authenticate, requireRole("admin"), deleteVideo);

export { educationalVideoRouter };