import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.types";
import { authenticate } from "./auth.authenticate";
import { sendAccessDeniedError, sendRoleExcludedError } from "./auth.errors";

export const requireRole = (...allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    await authenticate(req, res, () => {
      if (!req.userRole || !allowedRoles.includes(req.userRole)) {
        const roleNames = allowedRoles.join(" or ");
        return sendAccessDeniedError(res, roleNames);
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
        return sendRoleExcludedError(res, roleNames);
      }
      next();
    });
  };
};

export const authenticateAdmin = requireRole("admin");
export const authenticateUser = requireNotRole("admin");

export const conditionalAuthForVideos = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { status } = req.query;
  
  const queryStatus = status === "published" ? "uploaded" : status;
  
  if (queryStatus === "draft") {
    return requireRole("admin")(req, res, next);
  }
  
  return authenticate(req, res, next);
};