import { findUserByIdWithoutPassword, findAllUsers, updateUserActivity as updateUserActivityModel, toggleUserStatus as toggleUserStatusModel } from "../../models/User";
import { findSubscriptionByEmail, findAllSubscriptions } from "../../models/Subscription";

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
}

export const getUserById = async (userId: string): Promise<UserWithSubscription> => {
  const user = await findUserByIdWithoutPassword(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const subscription = await findSubscriptionByEmail(user.email);
  
  return {
    id: user._id.toString(),
    name: user.name || `${subscription?.firstName || ""} ${subscription?.lastName || ""}`.trim() || user.email.split("@")[0],
    email: user.email,
    phone: subscription?.phone || "N/A",
    image: user.image || "/uploads/images/avatar.png",
    joinedDate: user.createdAt,
    activity: user.activity,
    status: user.status || "Active",
    role: user.role || "user",
  };
};

export const getAllUsers = async (): Promise<UserWithSubscription[]> => {
  const users = await findAllUsers();

  const subscriptions = await findAllSubscriptions();

  // Create a map of email to subscription for quick lookup
  const subscriptionMap = new Map(
    subscriptions.map((sub) => [sub.email, sub])
  );

  // Combine user data with subscription data
  const usersWithSubscription: UserWithSubscription[] = users.map((user) => {
    const subscription = subscriptionMap.get(user.email);
    
    return {
      id: user._id.toString(),
      name: user.name || `${subscription?.firstName || ""} ${subscription?.lastName || ""}`.trim() || user.email.split("@")[0],
      email: user.email,
      phone: subscription?.phone || "N/A",
      image: user.image || "/uploads/images/avatar.png",
      joinedDate: user.createdAt,
      activity: user.activity,
      status: user.status || "Active",
      role: user.role || "user",
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