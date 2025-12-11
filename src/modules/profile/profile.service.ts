import bcrypt from "bcrypt";
import { User } from "../../models/User";

const SALT_ROUNDS = 10;

export const editProfile = async (
  userId: string,
  data: {
    name?: string;
    newPassword?: string;
    imagePath?: string;
  }
) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error("User not found");
  }

  if (data.name !== undefined) {
    user.name = data.name;
  }

  if (data.newPassword) {
    const hashedPassword = await bcrypt.hash(data.newPassword, SALT_ROUNDS);
    user.password = hashedPassword;
  }

  if (data.imagePath !== undefined) {
    user.image = data.imagePath;
  }

  await user.save();

  return {
    success: true,
    message: "Profile updated successfully",
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role
    }
  };
};

export const getProfile = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  
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
