import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { editProfile, getProfile } from "./profile.service";
import {
  sendUserIdNotFoundError,
  sendImageRequiredError,
  handleProfileError
} from "./helpers/profile.controller.errors";
import {
  extractImagePath,
  buildUpdateData
} from "./helpers/profile.controller.utils";

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return sendUserIdNotFoundError(res);
    }

    const { name, newPassword } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const imagePath = extractImagePath(files);

    const updateData = buildUpdateData(name, newPassword, imagePath);
    const result = await editProfile(userId, updateData);

    return res.status(200).json(result);
  } catch (error) {
    return handleProfileError(res, error);
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return sendUserIdNotFoundError(res);
    }

    const result = await getProfile(userId);
    return res.status(200).json(result);
  } catch (error) {
    return handleProfileError(res, error);
  }
};