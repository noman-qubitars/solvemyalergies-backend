import { Router } from "express";
import {
  createVideo,
  getVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
} from "./sessionVideo.controller";
import { authenticate, requireRole, conditionalAuthForVideos } from "../../middleware/auth";
import { uploadVideo } from "../../lib/upload";

const sessionVideoRouter = Router();

sessionVideoRouter.post("/", authenticate, requireRole("admin"), uploadVideo.single("video"), createVideo);
sessionVideoRouter.get("/", conditionalAuthForVideos, getVideos);
sessionVideoRouter.get("/:id", getVideoById);
sessionVideoRouter.put("/:id", authenticate, requireRole("admin"), uploadVideo.single("video"), updateVideo);
sessionVideoRouter.delete("/:id", authenticate, requireRole("admin"), deleteVideo);

export { sessionVideoRouter };