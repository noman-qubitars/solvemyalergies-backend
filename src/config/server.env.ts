import { toNumber } from "./env.utils";

const env = process.env;

export const serverConfig = {
  port: toNumber(env.PORT, 4000),
  otpExpirationMinutes: toNumber(env.OTP_EXPIRATION_MINUTES, 10),
};

