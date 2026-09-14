import { z } from "zod";
import { MAX_REFERRAL_STARS } from "./rewards.constants";

export const referralSchema = z.object({
  recipientEmail: z.string().email("A valid recipient email is required"),
  stars: z.number().int().positive().max(MAX_REFERRAL_STARS, `You can send a maximum of ${MAX_REFERRAL_STARS} stars via referral`),
});

export const redeemSchema = z.object({
  stars: z.number().int().positive(),
});

export const updateRewardSettingsSchema = z.object({
  rewardValuePerStar: z.number().positive().optional(),
  minimumRedemption: z.number().int().positive().optional(),
  expireEnabled: z.boolean().optional(),
  expireMonths: z.number().int().positive().optional(),
  fraudPreventionEnabled: z.boolean().optional(),
});
