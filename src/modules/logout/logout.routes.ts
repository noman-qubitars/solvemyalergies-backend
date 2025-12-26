import { Router } from "express";
import { logout } from "./logout.controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

router.post("/", authenticate, logout);

export { router as logoutRouter };