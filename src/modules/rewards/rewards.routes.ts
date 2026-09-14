import { Router } from "express";
import {
  getBalance,
  getAchievements,
  sendReferralReward,
  redeemReward,
  getRewardsAdminList,
  getRewardsAdminUserDetail,
  getSettings,
  updateSettings,
} from "./rewards.controller";
import { authenticate, requireRole } from "../../middleware/auth";
import { validate } from "../../lib/validation/validateRequest";
import { referralSchema, redeemSchema, updateRewardSettingsSchema } from "./rewards.schemas";

const rewardsRouter = Router();

// App (user) routes
rewardsRouter.get("/balance", authenticate, getBalance);
rewardsRouter.get("/achievements", authenticate, getAchievements);
rewardsRouter.post("/referral", authenticate, validate(referralSchema), sendReferralReward);
rewardsRouter.post("/redeem", authenticate, validate(redeemSchema), redeemReward);

// Admin portal routes
rewardsRouter.get("/admin/settings", requireRole("admin"), getSettings);
rewardsRouter.put("/admin/settings", requireRole("admin"), validate(updateRewardSettingsSchema), updateSettings);
rewardsRouter.get("/admin/:userId", requireRole("admin"), getRewardsAdminUserDetail);
rewardsRouter.get("/admin", requireRole("admin"), getRewardsAdminList);

export { rewardsRouter };
