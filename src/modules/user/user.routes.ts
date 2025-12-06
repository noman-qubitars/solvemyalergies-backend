import { Router } from "express";
import { getUsers, getUser, blockUser, heartbeat } from "./user.controller";
import { requireRole, requireNotRole } from "../../middleware/auth";

const router = Router();

router.post("/heartbeat", requireNotRole("admin"), heartbeat);
router.get("/", requireRole("admin"), getUsers);
router.get("/:id", requireRole("admin"), getUser);
router.put("/:id/block", requireRole("admin"), blockUser);

export { router as userRouter };