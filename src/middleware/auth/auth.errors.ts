import { Response } from "express";

export const handleAuthError = (res: Response, error: any) => {
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
};

export const sendUnauthorizedError = (res: Response, message: string = "Authorization token is required") => {
  return res.status(401).json({
    success: false,
    message
  });
};

export const sendInvalidTokenFormatError = (res: Response) => {
  return res.status(401).json({
    success: false,
    message: "Invalid authorization format. Use: Bearer <token>"
  });
};

export const sendUserNotFoundError = (res: Response) => {
  return res.status(401).json({
    success: false,
    message: "User not found"
  });
};

export const sendAccountBlockedError = (res: Response, status: string) => {
  return res.status(403).json({
    success: false,
    message: status === "inactive"
      ? "Your account is not verified. Please complete your subscription to activate your account"
      : "Your account has been blocked. Please contact support"
  });
};

export const sendAccessDeniedError = (res: Response, roleNames: string) => {
  return res.status(403).json({
    success: false,
    message: `Access denied. ${roleNames} privileges required`
  });
};

export const sendRoleExcludedError = (res: Response, roleNames: string) => {
  return res.status(403).json({
    success: false,
    message: `This endpoint is only available for users. ${roleNames.charAt(0).toUpperCase() + roleNames.slice(1)} access is not permitted.`
  });
};