export const validateUserId = (userId: string | undefined): { valid: boolean; error?: string } => {
  if (!userId) {
    return { valid: false, error: "User ID not found in token" };
  }
  return { valid: true };
};

export const canBlockUser = (role: string, status: string): boolean => {
  return !(role === "admin" && status === "Active");
};

export const getUserStatusMessage = (status: "Active" | "Blocked"): string => {
  return `User ${status === "Blocked" ? "blocked" : "unblocked"} successfully`;
};