import "dotenv/config";

const env = process.env;

const required = (key: string): string => {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing environment variable ${key}`);
  }
  return value;
};

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBool = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) {
    return fallback;
  }
  return value === "true" || value === "1";
};

export const config = {
  port: toNumber(env.PORT, 4000),
  jwtSecret: required("JWT_SECRET"),
  otpExpirationMinutes: toNumber(env.OTP_EXPIRATION_MINUTES, 10),
  databaseUrl: required("DATABASE_URL"),
  stripe: {
    publishableKey: required("STRIPE_PUBLISHABLE_KEY"),
    secretKey: required("STRIPE_SECRET_KEY"),
    webhookSecret: env.STRIPE_WEBHOOK_SECRET || ""
  },
  app: {
    playStoreUrl: env.PLAY_STORE_URL || "https://play.google.com/store/apps",
    appStoreUrl: env.APP_STORE_URL || "https://apps.apple.com/app"
  },
  email: {
    host: required("EMAIL_HOST"),
    port: toNumber(env.EMAIL_PORT, 587),
    user: required("EMAIL_USER"),
    pass: required("EMAIL_PASS"),
    from: required("EMAIL_FROM"),
    secure: toBool(env.EMAIL_SECURE, false)
  }
};