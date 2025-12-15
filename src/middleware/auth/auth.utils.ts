export const parseAuthHeader = (authHeader: string | undefined): { valid: boolean; token?: string; error?: string } => {
  if (!authHeader) {
    return { valid: false, error: "Authorization token is required" };
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return { valid: false, error: "Invalid authorization format. Use: Bearer <token>" };
  }

  return { valid: true, token: parts[1] };
};