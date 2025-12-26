import { Router } from "express";
import { getDemoVideo } from "./demoVideo.controller";
import { conditionalAuthForVideos } from "../../middleware/auth";

const demoVideoRouter = Router();

demoVideoRouter.get("/", conditionalAuthForVideos, getDemoVideo);

export { demoVideoRouter };