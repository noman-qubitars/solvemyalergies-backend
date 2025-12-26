import { required } from "./env.utils";

export const jwtConfig = {
  jwtSecret: required("JWT_SECRET"),
};