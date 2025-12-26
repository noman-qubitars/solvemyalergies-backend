import { Router } from "express";
import {
  createVideo,
  getVideos,
  updateVideo,
  deleteVideo,
} from "./educationalVideo.controller";
import {
  toggleFavorite,
  getFavoriteVideos,
} from "./educationalVideo.favorites.controller";
import { authenticate, requireRole, requireNotRole, conditionalAuthForVideos } from "../../middleware/auth";
import { uploadVideo } from "../../lib/upload";

const educationalVideoRouter = Router();

educationalVideoRouter.post("/", authenticate, requireRole("admin"), uploadVideo.single("video"), createVideo);
educationalVideoRouter.get("/favorites", authenticate, requireNotRole("admin"), getFavoriteVideos);
educationalVideoRouter.get("/", conditionalAuthForVideos, getVideos);
educationalVideoRouter.put("/:id/favorite", authenticate, requireNotRole("admin"), toggleFavorite);
educationalVideoRouter.put("/:id", authenticate, requireRole("admin"), uploadVideo.single("video"), updateVideo);
educationalVideoRouter.delete("/:id", authenticate, requireRole("admin"), deleteVideo);

export { educationalVideoRouter };