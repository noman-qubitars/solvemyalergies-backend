import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { validate } from "../../lib/validation/validateRequest";
import { editProfileSchema } from "./profile.schemas";
import { editProfile, getProfile } from "./profile.service";

export const updateProfile = [
  validate(editProfileSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const { name, newPassword, confirmPassword } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User ID not found in token"
        });
      }

      let imagePath: string | undefined;
      if (files && files.image && files.image.length > 0) {
        const imageFile = files.image[0];
        imagePath = `/uploads/images/${imageFile.filename}`;
      }

      if (imagePath === undefined) {
        return res.status(400).json({
          success: false,
          message: "Image is required"
        });
      }

      const updateData: {
        name?: string;
        newPassword?: string;
        imagePath?: string;
      } = {};

      if (name !== undefined) {
        updateData.name = name;
      }

      if (newPassword) {
        updateData.newPassword = newPassword;
      }

      updateData.imagePath = imagePath;

      const result = await editProfile(userId, updateData);

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error"
      });
    }
  }
];

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token"
      });
    }

    const result = await getProfile(userId);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};
