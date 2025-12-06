import { Request, Response } from "express";
import { getAllUsers, getUserById, toggleUserStatus, updateUserActivity } from "./user.service";
import { AuthRequest } from "../../middleware/auth";

const handleError = (error: unknown, res: Response) => {
  if (error instanceof Error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    return res.status(200).json({
      success: true,
      data: users,
      total: users.length,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const heartbeat = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    await updateUserActivity(userId);
    
    return res.status(200).json({
      success: true,
      message: "Activity updated successfully",
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const blockUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if the user exists and get their role
    const user = await getUserById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    
    // Prevent blocking admin accounts, but allow unblocking them
    if (user.role === "admin" && user.status === "Active") {
      return res.status(403).json({
        success: false,
        message: "Cannot block admin accounts",
      });
    }
    
    // Allow unblocking admin accounts (if they're already blocked)
    const result = await toggleUserStatus(id);
    return res.status(200).json({
      success: true,
      message: `User ${result.status === "Blocked" ? "blocked" : "unblocked"} successfully`,
      data: result,
    });
  } catch (error) {
    return handleError(error, res);
  }
};