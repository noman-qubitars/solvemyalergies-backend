import "dotenv/config";
import { serverConfig } from "./server.env";
import { jwtConfig } from "./jwt.env";
import { databaseConfig } from "./database.env";
import { stripeConfig } from "./stripe.env";
import { appConfig } from "./app.env";
import { emailConfig } from "./email.env";
import { s3Config } from "./s3.env";

export const config = {
  ...serverConfig,
  ...jwtConfig,
  ...databaseConfig,
  stripe: stripeConfig,
  app: appConfig,
  email: emailConfig,
  s3: s3Config,
};