import { Router } from "express";
import { 
  submitAnswer, 
  updateAnswer,
  patchAnswer,
  getQuestionsWithAnswers
} from "./quiz.controller";
import { requireRole, requireNotRole } from "../../middleware/auth";
import { handleQuizFileUpload } from "../../lib/upload";

const router = Router();

router.get("/questions-answers", requireRole("admin"), getQuestionsWithAnswers);
router.post("/answer", requireNotRole("admin"), submitAnswer);
router.put("/answer", requireNotRole("admin"), updateAnswer);
router.patch("/answer", requireNotRole("admin"), handleQuizFileUpload(10, 10), patchAnswer);

export { router as quizRouter };