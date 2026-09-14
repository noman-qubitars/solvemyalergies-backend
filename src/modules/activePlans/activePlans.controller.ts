import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { getUserActivePlans } from "./activePlans.service";

export const getActivePlans = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User ID not found in token" });
    }

    const data = await getUserActivePlans(userId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch active plans",
    });
  }
};
