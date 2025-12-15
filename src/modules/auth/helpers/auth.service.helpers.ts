import { findUserByEmail, createUser, updateUserById } from "../../../models/User";
import { findSubscriptionByEmail } from "../../../models/Subscription";
import bcrypt from "bcrypt";
import { SALT_ROUNDS } from "./auth.service.utils";

export const getUserOrSubscriptionUserId = async (email: string): Promise<{ userId: string; isSubscription: boolean } | null> => {
  const user = await findUserByEmail(email);
  
  if (user) {
    return { userId: user._id.toString(), isSubscription: false };
  }
  
  const subscription = await findSubscriptionByEmail(email);
  if (subscription) {
    return { userId: subscription._id.toString(), isSubscription: true };
  }
  
  return null;
};

export const createOrUpdateUserFromSubscription = async (email: string, password: string) => {
  const subscription = await findSubscriptionByEmail(email);
  
  if (!subscription) {
    throw new Error("Email not found. Please check your email address");
  }
  
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const userName = `${subscription.firstName} ${subscription.lastName}`.trim() || email.split("@")[0];
  const defaultImage = "/uploads/images/avatar.png";
  
  const existingUser = await findUserByEmail(email);
  
  if (existingUser) {
    return await updateUserById(existingUser._id.toString(), {
      password: hashedPassword,
      name: userName,
      image: defaultImage,
      status: "Active",
      activity: new Date(),
    });
  }
  
  return await createUser({
    email,
    password: hashedPassword,
    name: userName,
    image: defaultImage,
    status: "Active",
    activity: new Date(),
    role: "user",
  });
};