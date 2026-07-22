import jwt from "jsonwebtoken";
import { addTokenToBlacklist } from "../../models/TokenBlacklist";
import { endUserSession } from "../../models/UserSession";
import { revokeRefreshToken, revokeAllRefreshTokensForUser } from "../../models/RefreshToken";

export const logout = async (token: string, userId: string, refreshToken?: string): Promise<{ success: boolean; message: string }> => {
  try {
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    } else {
      await revokeAllRefreshTokensForUser(userId);
    }

    const decoded = jwt.decode(token) as { exp?: number } | null;

    if (!decoded || !decoded.exp) {
      await endUserSession(userId);
      return {
        success: true,
        message: "Logged out successfully"
      };
    }

    const expiresAt = new Date(decoded.exp * 1000);
    
    await addTokenToBlacklist(token, userId, expiresAt);
    await endUserSession(userId);

    return {
      success: true,
      message: "Logged out successfully"
    };
  } catch (error: any) {
    throw new Error(error.message || "Logout failed");
  }
};