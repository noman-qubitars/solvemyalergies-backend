import { required } from "./env.utils";

export const databaseConfig = {
  databaseUrl: required("DATABASE_URL"),
};

