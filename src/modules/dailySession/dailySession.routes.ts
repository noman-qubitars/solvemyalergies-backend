import { Router } from "express";
import { createSession, getSessions, getSessionByDate } from "./dailySession.controller";
import { getDailySessionQuestions } from "./dailySessionQuestion.controller";
import { authenticate, requireNotRole } from "../../middleware/auth";
import { validate } from "../../lib/validation/validateRequest";
import { createDailySessionSchema } from "./dailySession.schemas";

const router = Router();

router.get("/questions", getDailySessionQuestions);
router.post("/", requireNotRole("admin"), validate(createDailySessionSchema), createSession);
router.get("/", authenticate, getSessions);
router.get("/by-date", authenticate, getSessionByDate);

export { router as dailySessionRouter };