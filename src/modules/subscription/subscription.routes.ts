import { Router } from "express";
import { createCheckout, handleWebhook } from "./subscription.controller";

const router = Router();

router.post("/create-checkout", createCheckout);
router.post("/webhook", handleWebhook);

export { router as subscriptionRouter };