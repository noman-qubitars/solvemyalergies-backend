import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { config } from "../../config/env";
import { isS3Configured } from "../../config/s3.env";
import { generateUniqueFilename } from "./upload.utils";
import { getSubfolderByMimeType } from "./upload.utils";

// Initialize S3 client only if S3 is configured
let s3Client: S3Client | null = null;

if (isS3Configured()) {
  // Build S3 client config
  const s3ClientConfig: any = {
    region: config.s3.AWS_REGION,
  };

  // Only add explicit credentials if they're provided
  // If not provided, SDK will automatically use IAM role credentials
  if (config.s3.AWS_ACCESS_KEY_ID && config.s3.AWS_SECRET_ACCESS_KEY) {
    s3ClientConfig.credentials = {
      accessKeyId: config.s3.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.s3.AWS_SECRET_ACCESS_KEY,
    };
  }

  s3Client = new S3Client(s3ClientConfig);
}

// Get S3 bucket URL (with or without custom domain)
const getS3BucketUrl = () => {
  if (!config.s3.S3_BUCKET_NAME) {
    return "";
  }
  return config.s3.S3_BUCKET_URL || `https://${config.s3.S3_BUCKET_NAME}.s3.${config.s3.AWS_REGION}.amazonaws.com`;
};

// Create S3 storage for multer (only if S3 is configured)
export const createS3Storage = (subfolder?: string) => {
  if (!isS3Configured() || !s3Client || !config.s3.S3_BUCKET_NAME) {
    throw new Error("S3 is not configured. Please set S3_BUCKET_NAME and AWS_REGION environment variables.");
  }
  return multerS3({
    s3: s3Client,
    bucket: config.s3.S3_BUCKET_NAME,
    key: (_req: any, file: Express.Multer.File, cb: (error: Error | null, key: string) => void) => {
      const folder = subfolder || getSubfolderByMimeType(file.mimetype);
      const filename = generateUniqueFilename(file.originalname);
      const key = `uploads/${folder}/${filename}`;
      cb(null, key);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
  });
};

// Get S3 URL from key
export const getS3Url = (key: string): string => {
  // If key already contains full URL, return as is
  if (key.startsWith("http://") || key.startsWith("https://")) {
    return key;
  }
  // Remove leading slash if present
  const cleanKey = key.startsWith("/") ? key.substring(1) : key;
  return `${getS3BucketUrl()}/${cleanKey}`;
};

// Extract key from S3 URL
export const getS3KeyFromUrl = (url: string): string => {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return url; // Already a key
  }
  const bucketUrl = getS3BucketUrl();
  if (url.startsWith(bucketUrl)) {
    return url.replace(bucketUrl + "/", "");
  }
  // Fallback: try to extract from standard S3 URL format
  const match = url.match(/s3[^/]*\/[^/]+\/(.+)$/);
  return match ? match[1] : url;
};

export { s3Client, getS3BucketUrl };