import { Router } from "express";
import { getUsers, getUser, blockUser } from "./user.controller";
import { requireRole } from "../../middleware/auth";

const router = Router();

router.get("/", requireRole("admin"), getUsers);
router.get("/:id", requireRole("admin"), getUser);
router.put("/:id/block", requireRole("admin"), blockUser);

export { router as userRouter };