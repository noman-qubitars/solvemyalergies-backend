import { required, toNumber, toBool } from "./env.utils";

const env = process.env;

export const emailConfig = {
  host: required("EMAIL_HOST"),
  port: toNumber(env.EMAIL_PORT, 587),
  user: required("EMAIL_USER"),
  pass: required("EMAIL_PASS"),
  from: required("EMAIL_FROM"),
  secure: toBool(env.EMAIL_SECURE, false),
};