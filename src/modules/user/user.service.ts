import { User } from "../../models/User";
import { Subscription } from "../../models/Subscription";

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
  const user = await User.findById(userId).select("-password").lean();
  if (!user) {
    throw new Error("User not found");
  }

  const subscription = await Subscription.findOne({ email: user.email }).lean();
  
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
  // Get all users
  const users = await User.find().select("-password").sort({ createdAt: -1 });

  // Get all subscriptions
  const subscriptions = await Subscription.find();

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
  await User.findByIdAndUpdate(
    userId,
    { activity: new Date() },
    { new: true }
  );
};

export const toggleUserStatus = async (
  userId: string
): Promise<{ status: "Active" | "Blocked" }> => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error("User not found");
  }

  user.status = user.status === "Active" ? "Blocked" : "Active";
  user.activity = new Date();
  await user.save();

  return { status: user.status };
};