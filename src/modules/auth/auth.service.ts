import bcrypt from "bcrypt";
import { findUserByEmail, createUser, updateUserById } from "../../models/User";
import { findSubscriptionByEmail } from "../../models/Subscription";
import { sendOtpEmail } from "../../services/mailService";
import { createUserSession, endAllActiveSessions } from "../../models/UserSession";
import {
  createToken,
  generateOtpCode,
  createOtpRecord,
  getValidOtp,
  getLatestUnusedOtp,
  markOtpAsVerified,
  markOtpAsUsed,
  SALT_ROUNDS,
} from "./helpers/auth.service.utils";
import { getUserOrSubscriptionUserId, createOrUpdateUserFromSubscription } from "./helpers/auth.service.helpers";

export const signin = async (payload: { email: string; password: string }) => {
  const user = await findUserByEmail(payload.email);
  
  if (user && (user.status === "Blocked" || user.status === "inactive")) {
    throw new Error(user.status === "inactive" 
      ? "Your account is not verified. Please complete your subscription to activate your account"
      : "Your account has been blocked. Please contact support");
  }
  
  if (!user) {
    const subscription = await findSubscriptionByEmail(payload.email);
    
    if (!subscription) {
      throw new Error("Your email is incorrect");
    }
    
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const userName = `${subscription.firstName} ${subscription.lastName}`.trim() || payload.email.split("@")[0];
    const defaultImage = "/uploads/images/avatar.png";
    
    const existingUser = await findUserByEmail(payload.email);
    let createdUser;
    
    if (existingUser) {
      createdUser = await updateUserById(existingUser._id.toString(), {
        password: hashedPassword,
        name: userName,
        image: defaultImage,
        status: "Active",
        activity: new Date(),
      });
    } else {
      createdUser = await createUser({
        email: payload.email,
        password: hashedPassword,
        name: userName,
        image: defaultImage,
        status: "Active",
        activity: new Date(),
        role: "user"
      });
    }
    
    if (!createdUser) {
      throw new Error("Failed to create or update user");
    }
    
    const userId = createdUser._id.toString();
    await endAllActiveSessions(userId);
    await createUserSession(userId);
    
    return { 
      success: true,
      token: createToken(userId, "user"), 
      userId: userId,
      email: payload.email,
      name: userName,
      image: createdUser.image,
      role: "user"
    };
  }
  
  const isValid = await bcrypt.compare(payload.password, user.password);
  if (!isValid) {
    throw new Error("Your password is incorrect");
  }
  
  user.activity = new Date();
  await user.save();
  
  const userId = user._id.toString();
  const userRole = user.role || "user";
  const userName = user.name || payload.email.split("@")[0];
  const userImage = user.image || "/uploads/images/avatar.png";
  
  await endAllActiveSessions(userId);
  await createUserSession(userId);
  
  return { 
    success: true,
    token: createToken(userId, userRole), 
    userId: userId,
    email: payload.email,
    name: userName,
    image: userImage,
    role: userRole
  };
};

export const requestPasswordReset = async (email: string) => {
  const userInfo = await getUserOrSubscriptionUserId(email);
  
  if (!userInfo) {
    throw new Error("Email not found. Please check your email address");
  }
  
  const otp = generateOtpCode();
  await createOtpRecord(userInfo.userId, otp);
  await sendOtpEmail(email, otp);
  
  return { 
    success: true,
    message: "OTP sent to your email" 
  };
};

export const resendOtp = async (email: string) => {
  const userInfo = await getUserOrSubscriptionUserId(email);
  
  if (!userInfo) {
    throw new Error("Email not found. Please check your email address");
  }
  
  const otp = generateOtpCode();
  await createOtpRecord(userInfo.userId, otp);
  await sendOtpEmail(email, otp);
  
  return { 
    success: true,
    message: "OTP resent to your email" 
  };
};

export const verifyOtp = async (email: string, code: string) => {
  const userInfo = await getUserOrSubscriptionUserId(email);
  
  if (!userInfo) {
    throw new Error("Email not found. Please check your email address");
  }
  
  const record = await getValidOtp(userInfo.userId, code);
  await markOtpAsVerified(record._id.toString());
  
  return { 
    success: true,
    message: "OTP verified successfully" 
  };
};

export const resetPassword = async (payload: { email: string; password: string }) => {
  const user = await findUserByEmail(payload.email);
  
  if (!user) {
    const userInfo = await getUserOrSubscriptionUserId(payload.email);
    
    if (!userInfo) {
      throw new Error("Email not found. Please check your email address");
    }
    
    const record = await getLatestUnusedOtp(userInfo.userId);
    await markOtpAsUsed(record._id.toString());
    
    await createOrUpdateUserFromSubscription(payload.email, payload.password);
    
    return { 
      success: true,
      message: "Password reset successfully" 
    };
  }
  
  const userId = user._id.toString();
  const record = await getLatestUnusedOtp(userId);
  await markOtpAsUsed(record._id.toString());
  
  const hashedPassword = await bcrypt.hash(payload.password, SALT_ROUNDS);
  await updateUserById(userId, { password: hashedPassword });

  return { 
    success: true,
    message: "Password reset successfully" 
  };
};