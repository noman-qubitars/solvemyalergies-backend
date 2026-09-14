import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import {
  getUserRewardBalance,
  getUserAchievements,
  sendReferral,
  redeemStars,
  getAdminRewardsList,
  getAdminUserRewardDetail,
  getRewardSettings,
  updateRewardSettings,
} from "./rewards.service";
import { sendUserIdNotFoundError, sendUserIdRequiredError, handleRewardsError } from "./helpers/rewards.controller.errors";

export const getBalance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return sendUserIdNotFoundError(res);

    const result = await getUserRewardBalance(userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    return handleRewardsError(res, error, "Failed to fetch rewards balance");
  }
};

export const getAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return sendUserIdNotFoundError(res);

    const result = await getUserAchievements(userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    return handleRewardsError(res, error, "Failed to fetch achievements");
  }
};

export const sendReferralReward = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return sendUserIdNotFoundError(res);

    const { recipientEmail, stars } = req.body;
    const result = await sendReferral(userId, recipientEmail, stars);
    res.status(200).json(result);
  } catch (error) {
    return handleRewardsError(res, error, "Failed to send referral");
  }
};

export const redeemReward = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return sendUserIdNotFoundError(res);

    const { stars } = req.body;
    const result = await redeemStars(userId, stars);
    res.status(200).json(result);
  } catch (error) {
    return handleRewardsError(res, error, "Failed to redeem stars");
  }
};

export const getRewardsAdminList = async (req: AuthRequest, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const result = await getAdminRewardsList(search, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleRewardsError(res, error, "Failed to fetch rewards list");
  }
};

export const getRewardsAdminUserDetail = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;
    if (!userId) return sendUserIdRequiredError(res);

    const result = await getAdminUserRewardDetail(userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    return handleRewardsError(res, error, "Failed to fetch user reward detail");
  }
};

export const getSettings = async (_req: AuthRequest, res: Response) => {
  try {
    const result = await getRewardSettings();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    return handleRewardsError(res, error, "Failed to fetch reward settings");
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const result = await updateRewardSettings(req.body);
    res.status(200).json({ success: true, message: "Settings updated successfully", data: result });
  } catch (error) {
    return handleRewardsError(res, error, "Failed to update reward settings");
  }
};
