import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  name?: string;
  role: "user" | "admin";
  status: "Active" | "Blocked";
  activity: Date;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: { type: String, enum: ["Active", "Blocked"], default: "Active" },
    activity: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
  },
  { collection: "users" }
);

export const User = mongoose.model<IUser>("User", UserSchema);