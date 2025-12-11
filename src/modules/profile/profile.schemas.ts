import { z } from "zod";

export const editProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters").optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && !data.confirmPassword) {
    return false;
  }
  if (data.newPassword && data.confirmPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
