import { Router } from "express";
import { sendFeedback } from "./support.controller";
import { validate } from "../../lib/validation/validateRequest";
import { sendFeedbackSchema } from "./support.schemas";
import { authenticate } from "../../middleware/auth";

const router = Router();

router.post("/", authenticate, validate(sendFeedbackSchema), sendFeedback);

export { router as supportRouter };