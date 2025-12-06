"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
require("dotenv/config");
const env = process.env;
const required = (key) => {
    const value = env[key];
    if (!value) {
        throw new Error(`Missing environment variable ${key}`);
    }
    return value;
};
const toNumber = (value, fallback) => {
    if (!value) {
        return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
const toBool = (value, fallback) => {
    if (!value) {
        return fallback;
    }
    return value === "true" || value === "1";
};
exports.config = {
    port: toNumber(env.PORT, 4000),
    jwtSecret: required("JWT_SECRET"),
    otpExpirationMinutes: toNumber(env.OTP_EXPIRATION_MINUTES, 10),
    databaseUrl: required("DATABASE_URL"),
    email: {
        host: required("EMAIL_HOST"),
        port: toNumber(env.EMAIL_PORT, 587),
        user: required("EMAIL_USER"),
        pass: required("EMAIL_PASS"),
        from: required("EMAIL_FROM"),
        secure: toBool(env.EMAIL_SECURE, false)
    }
};
