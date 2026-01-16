import { User } from "../../../models/User";

/**
 * Determines if user is admin
 */
export const checkIsAdmin = async (userId: string, userRole?: string): Promise<boolean> => {
  if (userRole === "admin") {
    return true;
  }
  
  try {
    const user = await User.findById(userId);
    return user?.role === "admin";
  } catch (error) {
    return false;
  }
};

/**
 * Gets target user ID based on admin status
 */
export const getTargetUserId = (
  isAdmin: boolean,
  currentUserId: string,
  queryUserId?: string
): string => {
  return isAdmin ? (queryUserId || currentUserId) : currentUserId;
};

/**
 * Builds query parameters for getMessages
 */
export const buildGetMessagesParams = (
  isAdmin: boolean,
  requestUserId: string | undefined,
  queryUserId?: string,
  isRead?: string
): { userId?: string; isRead?: boolean } => {
  const params: { userId?: string; isRead?: boolean } = {};
  
  if (isAdmin) {
    if (queryUserId) params.userId = queryUserId as string;
  } else {
    params.userId = requestUserId;
  }
  
  if (isRead !== undefined) {
    params.isRead = isRead === "true";
  }

  return params;
};

/**
 * Extracts userId from request params or auth
 */
export const extractUserId = (
  paramUserId: string | undefined,
  authUserId: string | undefined
): string | undefined => {
  return paramUserId || authUserId;
};