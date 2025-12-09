import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../../config/env";
import { User } from "../../models/User";
import { Subscription } from "../../models/Subscription";
import { OtpToken } from "../../models/OtpToken";
import { sendOtpEmail } from "../../services/mailService";

const SALT_ROUNDS = 10;
const OTP_LENGTH = 4;

const createToken = (userId: string, role?: string) => {
  const payload: { sub: string; role?: string } = { sub: userId };
  if (role) {
    payload.role = role;
  }
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "1d" });
};

const generateOtpCode = () => {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

const createOtpRecord = async (userId: string, code: string) => {
  const hashedCode = await bcrypt.hash(code, SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  return OtpToken.create({
    code: hashedCode,
    expiresAt,
    userId
  });
};

const getValidOtp = async (userId: string, code: string) => {
  const now = new Date();
  const record = await OtpToken.findOne({
    userId,
    used: false,
    expiresAt: { $gt: now }
  }).sort({ createdAt: -1 });
  if (!record) {
    const expiredRecord = await OtpToken.findOne({
      userId,
      used: false
    }).sort({ createdAt: -1 });
    if (expiredRecord) {
      throw new Error("OTP code has expired. Please request a new code");
    }
    throw new Error("Invalid OTP code. Please check and try again");
  }
  const match = await bcrypt.compare(code, record.code);
  if (!match) {
    throw new Error("Invalid OTP code. Please check and try again");
  }
  return record;
};

const getLatestUnusedOtp = async (userId: string) => {
  const now = new Date();
  const verifiedRecord = await OtpToken.findOne({
    userId,
    used: false,
    verified: true
  }).sort({ verifiedAt: -1 });
  
  if (verifiedRecord) {
    const verifiedTime = verifiedRecord.verifiedAt ? new Date(verifiedRecord.verifiedAt).getTime() : 0;
    const timeSinceVerification = now.getTime() - verifiedTime;
    const fiveMinutes = 5 * 60 * 1000;
    
    if (timeSinceVerification <= fiveMinutes) {
      return verifiedRecord;
    } else {
      throw new Error("OTP verification has expired. Please verify OTP again");
    }
  }
  
  const unexpiredRecord = await OtpToken.findOne({
    userId,
    used: false,
    expiresAt: { $gt: now }
  }).sort({ createdAt: -1 });
  
  if (unexpiredRecord) {
    throw new Error("Please verify OTP first");
  }
  
  throw new Error("No verified OTP found. Please verify OTP first");
};

export const signin = async (payload: { email: string; password: string }) => {
  const user = await User.findOne({ email: payload.email });
  
  if (user && (user.status === "Blocked" || user.status === "inactive")) {
    throw new Error(user.status === "inactive" 
      ? "Your account is not verified. Please complete your subscription to activate your account"
      : "Your account has been blocked. Please contact support");
  }
  
  if (!user) {
    const subscription = await Subscription.findOne({ email: payload.email });
    
    if (!subscription) {
      throw new Error("Your email is incorrect");
    }
    
    // Hash the password from payload since subscription doesn't store password
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    
    const userName = `${subscription.firstName} ${subscription.lastName}`.trim() || payload.email.split("@")[0];
    const createdUser = await User.findOneAndUpdate(
      { email: payload.email },
      {
        email: payload.email,
        password: hashedPassword,
        name: userName,
        status: "Active",
        activity: new Date(),
        role: "user"
      },
      { upsert: true, new: true }
    );
    
    const userId = createdUser._id.toString();
    return { 
      success: true,
      token: createToken(userId, "user"), 
      userId: userId,
      email: payload.email,
      name: userName,
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
  
  return { 
    success: true,
    token: createToken(userId, userRole), 
    userId: userId,
    email: payload.email,
    name: userName,
    role: userRole
  };
};

export const requestPasswordReset = async (email: string) => {
  const user = await User.findOne({ email });
  
  if (!user) {
    let subscription = await Subscription.findOne({ email });
    if (!subscription) {
      throw new Error("Email not found. Please check your email address");
    }
    const userId = subscription._id.toString();
    const otp = generateOtpCode();
    await createOtpRecord(userId, otp);
    await sendOtpEmail(email, otp);
    return { 
      success: true,
      message: "OTP sent to your email" 
    };
  }
  
  const userId = user._id.toString();
  const otp = generateOtpCode();
  await createOtpRecord(userId, otp);
  await sendOtpEmail(email, otp);
  return { 
    success: true,
    message: "OTP sent to your email" 
  };
};

export const resendOtp = async (email: string) => {
  const user = await User.findOne({ email });
  
  if (!user) {
    let subscription = await Subscription.findOne({ email });
    if (!subscription) {
      throw new Error("Email not found. Please check your email address");
    }
    const userId = subscription._id.toString();
    const otp = generateOtpCode();
    await createOtpRecord(userId, otp);
    await sendOtpEmail(email, otp);
    return { 
      success: true,
      message: "OTP resent to your email" 
    };
  }
  
  const userId = user._id.toString();
  const otp = generateOtpCode();
  await createOtpRecord(userId, otp);
  await sendOtpEmail(email, otp);
  return { 
    success: true,
    message: "OTP resent to your email" 
  };
};

export const verifyOtp = async (email: string, code: string) => {
  const user = await User.findOne({ email });
  
  if (!user) {
    let subscription = await Subscription.findOne({ email });
    if (!subscription) {
      throw new Error("Email not found. Please check your email address");
    }
    const userId = subscription._id.toString();
    const record = await getValidOtp(userId, code);
    await OtpToken.updateOne({ _id: record._id }, { verified: true, verifiedAt: new Date() });
    return { 
      success: true,
      message: "OTP verified successfully" 
    };
  }
  
  const userId = user._id.toString();
  const record = await getValidOtp(userId, code);
  await OtpToken.updateOne({ _id: record._id }, { verified: true, verifiedAt: new Date() });
  return { 
    success: true,
    message: "OTP verified successfully" 
  };
};

export const resetPassword = async (payload: { email: string; password: string }) => {
  const user = await User.findOne({ email: payload.email });
  
  if (!user) {
    let subscription = await Subscription.findOne({ email: payload.email });
    if (!subscription) {
      throw new Error("Email not found. Please check your email address");
    }
    const userId = subscription._id.toString();
    const record = await getLatestUnusedOtp(userId);
    await OtpToken.updateOne({ _id: record._id }, { used: true });
    const hashedPassword = await bcrypt.hash(payload.password, SALT_ROUNDS);
    await Subscription.updateOne({ _id: subscription._id }, { password: hashedPassword });
    return { 
      success: true,
      message: "Password reset successfully" 
    };
  }
  
  const userId = user._id.toString();
  const record = await getLatestUnusedOtp(userId);
  await OtpToken.updateOne({ _id: record._id }, { used: true });
  const hashedPassword = await bcrypt.hash(payload.password, SALT_ROUNDS);
  await User.updateOne({ _id: user._id }, { password: hashedPassword });

  return { 
    success: true,
    message: "Password reset successfully" 
  };
};