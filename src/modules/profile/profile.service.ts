import { findUserById, findUserByIdWithoutPassword, updateUserById } from "../../models/User";
import { hashPassword } from "./helpers/profile.service.utils";

export const editProfile = async (
  userId: string,
  data: {
    name?: string;
    newPassword?: string;
    imagePath?: string;
  }
) => {
  const user = await findUserById(userId);
  
  if (!user) {
    throw new Error("User not found");
  }

  const updateData: Partial<{
    name: string;
    password: string;
    image: string;
  }> = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.newPassword) {
    updateData.password = await hashPassword(data.newPassword);
  }

  if (data.imagePath !== undefined) {
    updateData.image = data.imagePath;
  }

  const updatedUser = await updateUserById(userId, updateData);
  
  if (!updatedUser) {
    throw new Error("Failed to update profile");
  }

  return {
    success: true,
    message: "Profile updated successfully",
    data: {
      id: updatedUser._id,
      email: updatedUser.email,
      name: updatedUser.name,
      image: updatedUser.image,
      role: updatedUser.role
    }
  };
};

export const getProfile = async (userId: string) => {
  const user = await findUserByIdWithoutPassword(userId);
  
  if (!user) {
    throw new Error("User not found");
  }

  return {
    success: true,
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      image: user.image || "/uploads/images/avatar.png",
      role: user.role,
      status: user.status,
      activity: user.activity,
      createdAt: user.createdAt
    }
  };
};
