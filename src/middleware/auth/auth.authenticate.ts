import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../config/env";
import { User } from "../../models/User";
import { isTokenBlacklisted } from "../../models/TokenBlacklist";
import { AuthRequest } from "./auth.types";
import {
  handleAuthError,
  sendUnauthorizedError,
  sendInvalidTokenFormatError,
  sendUserNotFoundError,
  sendAccountBlockedError,
} from "./auth.errors";
import { parseAuthHeader } from "./auth.utils";

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const parsed = parseAuthHeader(authHeader);

    if (!parsed.valid) {
      if (parsed.error === "Authorization token is required") {
        return sendUnauthorizedError(res);
      }
      return sendInvalidTokenFormatError(res);
    }

    try {
      const token = parsed.token!;
      
      const blacklisted = await isTokenBlacklisted(token);
      if (blacklisted) {
        return res.status(401).json({
          success: false,
          message: "Token has been invalidated. Please sign in again"
        });
      }

      const decoded = jwt.verify(token, config.jwtSecret) as { sub: string; role?: string };
      req.userId = decoded.sub;
      req.userRole = decoded.role;
      
      const user = await User.findById(decoded.sub);
      if (!user) {
        return sendUserNotFoundError(res);
      }

      if (user.status === "Blocked" || user.status === "inactive") {
        return sendAccountBlockedError(res, user.status);
      }
      
      next();
    } catch (error: any) {
      return handleAuthError(res, error);
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Authentication error"
    });
  }
};