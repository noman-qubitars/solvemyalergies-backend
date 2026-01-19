import { findUserByIdWithoutPassword, findAllUsers, updateUserActivity as updateUserActivityModel, toggleUserStatus as toggleUserStatusModel } from "../../models/User";
import { findSubscriptionByEmail, findAllSubscriptions } from "../../models/Subscription";
import { getActiveSession, UserSessionModel } from "../../models/UserSession";
import { normalizeAvatarUrl } from "../../lib/upload/upload.avatar";

export interface UserWithSubscription {
  id: string;
  name: string;
  email: string;
  phone: string;
  image?: string;
  joinedDate: Date;
  activity: Date;
  status: "Active" | "Blocked" | "inactive";
  role: "user" | "admin";
  isOnline?: boolean;
  lastSessionEnd?: Date;
}

export const getUserById = async (userId: string): Promise<UserWithSubscription> => {
  const user = await findUserByIdWithoutPassword(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const subscription = await findSubscriptionByEmail(user.email);
  const activeSession = await getActiveSession(user._id.toString());
  
  const lastSession = activeSession ? null : await UserSessionModel.findOne({
    userId: user._id.toString(),
    isActive: false
  }).sort({ endTime: -1 });

  const normalizedImage = await normalizeAvatarUrl(user.image);

  return {
    id: user._id.toString(),
    name: user.name || `${subscription?.firstName || ""} ${subscription?.lastName || ""}`.trim() || user.email.split("@")[0],
    email: user.email,
    phone: subscription?.phone || "N/A",
    image: normalizedImage,
    joinedDate: user.createdAt,
    activity: user.activity,
    status: user.status || "Active",
    role: user.role || "user",
    isOnline: !!activeSession,
    lastSessionEnd: lastSession?.endTime || undefined,
  };
};

export const getAllUsers = async (): Promise<UserWithSubscription[]> => {
  const users = await findAllUsers();

  const subscriptions = await findAllSubscriptions();

  const subscriptionMap = new Map(
    subscriptions.map((sub) => [sub.email, sub])
  );

  const userIds = users.map(user => user._id.toString());
  const activeSessions = await Promise.all(
    userIds.map(userId => getActiveSession(userId))
  );
  const activeSessionMap = new Map(
    activeSessions.map((session, index) => [userIds[index], session])
  );

  const lastSessions = await Promise.all(
    userIds.map(async (userId) => {
      if (activeSessionMap.get(userId)) return null;
      return await UserSessionModel.findOne({
        userId,
        isActive: false
      }).sort({ endTime: -1 });
    })
  );
  const lastSessionMap = new Map(
    lastSessions.map((session, index) => [userIds[index], session])
  );

  const normalizedImages = await Promise.all(
    users.map(user => normalizeAvatarUrl(user.image))
  );

  const usersWithSubscription: UserWithSubscription[] = users.map((user, index) => {
    const subscription = subscriptionMap.get(user.email);
    const userId = user._id.toString();
    const activeSession = activeSessionMap.get(userId);
    const lastSession = lastSessionMap.get(userId);
    
    return {
      id: userId,
      name: user.name || `${subscription?.firstName || ""} ${subscription?.lastName || ""}`.trim() || user.email.split("@")[0],
      email: user.email,
      phone: subscription?.phone || "N/A",
      image: normalizedImages[index],
      joinedDate: user.createdAt,
      activity: user.activity,
      status: user.status || "Active",
      role: user.role || "user",
      isOnline: !!activeSession,
      lastSessionEnd: lastSession?.endTime || undefined,
    };
  });

  return usersWithSubscription;
};

export const updateUserActivity = async (userId: string): Promise<void> => {
  await updateUserActivityModel(userId);
};

export const toggleUserStatus = async (
  userId: string
): Promise<{ status: "Active" | "Blocked" }> => {
  const user = await toggleUserStatusModel(userId);
  return { status: user.status as "Active" | "Blocked" };
};