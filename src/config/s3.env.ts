import { z } from "zod";

const s3EnvSchema = z.object({
  AWS_REGION: z.string().default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  S3_BUCKET_URL: z.string().optional(),
});

export const s3Config = s3EnvSchema.parse({
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  S3_BUCKET_URL: process.env.S3_BUCKET_URL,
});

// Check if S3 is fully configured
// Supports both IAM roles (no credentials needed) and explicit credentials
export const isS3Configured = (): boolean => {
  // S3 is configured if we have bucket name and region
  // Credentials can come from IAM role (automatic) or explicit env vars
  return !!(
    s3Config.S3_BUCKET_NAME &&
    s3Config.AWS_REGION
  );
};

