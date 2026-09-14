import { Router } from "express";
import { getActivePlans } from "./activePlans.controller";
import { authenticate } from "../../middleware/auth";

const activePlansRouter = Router();

activePlansRouter.get("/", authenticate, getActivePlans);

export { activePlansRouter };
