import mongoose, { Document } from "mongoose";
import { UserSchema, IUser } from "../schemas/User.schema";

export interface IUserDocument extends IUser, Document {}

export const UserModel = mongoose.model<IUserDocument>("User", UserSchema);

export { UserModel as User };
export { IUser, UserSchema };

export const findUserById = async (userId: string) => {
  return await UserModel.findById(userId);
};

export const findUserByEmail = async (email: string) => {
  return await UserModel.findOne({ email });
};

export const findUserByIdWithoutPassword = async (userId: string) => {
  return await UserModel.findById(userId).select("-password").lean();
};

export const findAllUsers = async () => {
  return await UserModel.find().select("-password").sort({ createdAt: -1 });
};

export const createUser = async (userData: Partial<IUser>) => {
  return await UserModel.create(userData);
};

export const updateUserById = async (userId: string, updateData: Partial<IUser>) => {
  return await UserModel.findByIdAndUpdate(
    userId,
    updateData,
    { new: true }
  );
};

export const updateUserActivity = async (userId: string) => {
  return await UserModel.findByIdAndUpdate(
    userId,
    { activity: new Date() },
    { new: true }
  );
};

export const toggleUserStatus = async (userId: string): Promise<IUserDocument> => {
  const user = await UserModel.findById(userId);
  
  if (!user) {
    throw new Error("User not found");
  }

  user.status = user.status === "Active" ? "Blocked" : "Active";
  user.activity = new Date();
  await user.save();

  return user;
};