import { required, toNumber } from "./env.utils";

export const jwtConfig = {
  jwtSecret: required("JWT_SECRET"),
  accessTokenExpiryMinutes: toNumber(process.env.ACCESS_TOKEN_EXPIRY_MINUTES, 15),
  refreshTokenExpiryHours: toNumber(process.env.REFRESH_TOKEN_EXPIRY_HOURS, 1 / 60), // TESTING: 5 minutes — revert to 24 after testing
};