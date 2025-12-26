import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { logout as logoutService } from "./logout.service";
import { parseAuthHeader } from "../../middleware/auth/auth.utils";

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token"
      });
    }

    const authHeader = req.headers.authorization;
    const parsed = parseAuthHeader(authHeader);

    if (!parsed.valid || !parsed.token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization token"
      });
    }

    const result = await logoutService(parsed.token, userId);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Logout failed"
    });
  }
};