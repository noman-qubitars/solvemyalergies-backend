import { Router } from "express";
import { 
  submitAnswer, 
  updateAnswer,
  getQuestionsWithAnswers
} from "./quiz.controller";
import { requireRole, requireNotRole } from "../../middleware/auth";

const router = Router();

router.get("/questions-answers", requireRole("admin"), getQuestionsWithAnswers);
router.post("/answer", requireNotRole("admin"), submitAnswer);
router.put("/answer", requireNotRole("admin"), updateAnswer);

export { router as quizRouter };