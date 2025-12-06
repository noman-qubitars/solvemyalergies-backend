import { Router } from "express";
import { createCheckout, verifyPayment, handleWebhook } from "./subscription.controller";

const router = Router();

router.post("/create-checkout", createCheckout);
router.post("/verify-payment", verifyPayment);
router.post("/webhook", handleWebhook);

export { router as subscriptionRouter };