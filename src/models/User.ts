import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  name?: string;
  image?: string;
  role: "user" | "admin";
  status: "Active" | "Blocked" | "inactive";
  activity: Date;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    image: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: { type: String, enum: ["Active", "Blocked", "inactive"], default: "Active" },
    activity: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
  },
  { collection: "users" }
);

export const User = mongoose.model<IUser>("User", UserSchema);