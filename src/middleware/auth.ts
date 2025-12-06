import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { User } from "../models/User";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required"
      });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format. Use: Bearer <token>"
      });
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { sub: string; role?: string };
      req.userId = decoded.sub;
      req.userRole = decoded.role;
      
      const user = await User.findById(decoded.sub);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found"
        });
      }

      if (user.status === "Blocked") {
        return res.status(403).json({
          success: false,
          message: "Your account has been blocked. Please contact support"
        });
      }
      
      next();
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token has expired. Please sign in again"
        });
      }
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token format"
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Authentication error"
    });
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    await authenticate(req, res, () => {
      if (!req.userRole || !allowedRoles.includes(req.userRole)) {
        const roleNames = allowedRoles.join(" or ");
        return res.status(403).json({
          success: false,
          message: `Access denied. ${roleNames} privileges required`
        });
      }
      next();
    });
  };
};

export const requireNotRole = (...excludedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    await authenticate(req, res, () => {
      if (req.userRole && excludedRoles.includes(req.userRole)) {
        const roleNames = excludedRoles.join(" or ");
        return res.status(403).json({
          success: false,
          message: `Access denied. This endpoint is not available for ${roleNames}`
        });
      }
      next();
    });
  };
};

export const authenticateAdmin = requireRole("admin");
export const authenticateUser = requireNotRole("admin");

/**
 * Conditional authentication middleware for educational videos
 * - If status is "draft", requires admin token only
 * - If status is "uploaded" or no status, allows both admin and user tokens
 */
export const conditionalAuthForVideos = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { status } = req.query;
  
  // Map "published" to "uploaded" for compatibility
  const queryStatus = status === "published" ? "uploaded" : status;
  
  // If status is "draft", require admin token
  if (queryStatus === "draft") {
    return requireRole("admin")(req, res, next);
  }
  
  // For "uploaded" status or no status, allow both admin and user tokens
  // Just authenticate (don't check role)
  return authenticate(req, res, next);
};