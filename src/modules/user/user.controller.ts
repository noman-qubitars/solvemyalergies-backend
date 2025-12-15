import { Request, Response } from "express";
import { getAllUsers, getUserById, toggleUserStatus, updateUserActivity } from "./user.service";
import { AuthRequest } from "../../middleware/auth";
import {
  handleControllerError,
  sendUserNotFoundError,
  sendUserIdNotFoundError,
  sendCannotBlockAdminError,
} from "./helpers/user.controller.errors";
import { validateUserId, canBlockUser, getUserStatusMessage } from "./helpers/user.controller.utils";

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    return res.status(200).json({
      success: true,
      data: users,
      total: users.length,
    });
  } catch (error) {
    return handleControllerError(error, res);
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
    return handleControllerError(error, res);
  }
};

export const heartbeat = async (req: AuthRequest, res: Response) => {
  try {
    const userIdValidation = validateUserId(req.userId);
    
    if (!userIdValidation.valid) {
      return sendUserIdNotFoundError(res);
    }

    await updateUserActivity(req.userId!);
    
    return res.status(200).json({
      success: true,
      message: "Activity updated successfully",
    });
  } catch (error) {
    return handleControllerError(error, res);
  }
};

export const blockUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await getUserById(id);
    
    if (!user) {
      return sendUserNotFoundError(res);
    }
    
    if (!canBlockUser(user.role, user.status)) {
      return sendCannotBlockAdminError(res);
    }
    
    const result = await toggleUserStatus(id);
    return res.status(200).json({
      success: true,
      message: getUserStatusMessage(result.status as "Active" | "Blocked"),
      data: result,
    });
  } catch (error) {
    return handleControllerError(error, res);
  }
};