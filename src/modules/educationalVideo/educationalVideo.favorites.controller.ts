import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import {
  toggleVideoFavorite,
  getUserFavoriteVideos,
} from "./educationalVideo.favorites.service";
import {
  sendUserIdNotFoundError,
  handleFavoriteError,
} from "./helpers/educationalVideo.favorites.errors";
import {
  parsePaginationParams,
} from "./helpers/educationalVideo.controller.utils";
import {
  sendInvalidPageNumberError,
  sendInvalidPageSizeError,
} from "./helpers/educationalVideo.controller.errors";

export const toggleFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return sendUserIdNotFoundError(res);
    }

    const { id: videoId } = req.params;

    const result = await toggleVideoFavorite(userId, videoId);

    res.status(200).json(result);
  } catch (error) {
    return handleFavoriteError(res, error, "Failed to toggle video favorite");
  }
};

export const getFavoriteVideos = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return sendUserIdNotFoundError(res);
    }

    const { page, pageSize } = req.query;
    const pagination = parsePaginationParams(page as string | undefined, pageSize as string | undefined);

    if (pagination.error) {
      if (pagination.error === "Invalid page number") {
        return sendInvalidPageNumberError(res);
      }
      return sendInvalidPageSizeError(res);
    }

    const result = await getUserFavoriteVideos(userId, pagination.page, pagination.pageSize);

    res.status(200).json(result);
  } catch (error) {
    return handleFavoriteError(res, error, "Failed to fetch favorite videos");
  }
};