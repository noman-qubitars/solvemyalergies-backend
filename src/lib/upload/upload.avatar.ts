import { PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";
import { join } from "path";
import { s3Client, getS3Url } from "./upload.s3";
import { config } from "../../config/env";
import { isS3Configured } from "../../config/s3.env";

const DEFAULT_AVATAR_KEY = "uploads/profile/avatar.png";

const getAvatarFilePath = (): string => {
  if (process.env.NODE_ENV === "production") {
    return join(process.cwd(), "avatar.png");
  }
  return join(process.cwd(), "avatar.png");
};

export const getDefaultAvatarUrl = async (): Promise<string> => {
  if (!isS3Configured() || !s3Client || !config.s3.S3_BUCKET_NAME) {
    return "/uploads/images/avatar.png";
  }

  try {
    const headCommand = new HeadObjectCommand({
      Bucket: config.s3.S3_BUCKET_NAME,
      Key: DEFAULT_AVATAR_KEY,
    });

    try {
      await s3Client.send(headCommand);
      return getS3Url(DEFAULT_AVATAR_KEY);
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        await uploadDefaultAvatar();
        return getS3Url(DEFAULT_AVATAR_KEY);
      }
      throw error;
    }
  } catch (error) {
    console.error("Error checking/uploading default avatar:", error);
    return "/uploads/images/avatar.png";
  }
};

export const normalizeAvatarUrl = async (imageUrl: string | undefined | null): Promise<string> => {
  if (!imageUrl || imageUrl === "/uploads/images/avatar.png" || imageUrl === "/uploads/profile/avatar.png") {
    return await getDefaultAvatarUrl();
  }
  
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  
  if (imageUrl.startsWith("/uploads/")) {
    return getS3Url(imageUrl);
  }
  
  return imageUrl;
};

const uploadDefaultAvatar = async (): Promise<void> => {
  if (!isS3Configured() || !s3Client || !config.s3.S3_BUCKET_NAME) {
    throw new Error("S3 is not configured");
  }

  try {
    const avatarFilePath = getAvatarFilePath();
    const avatarBuffer = readFileSync(avatarFilePath);
    
    const uploadCommand = new PutObjectCommand({
      Bucket: config.s3.S3_BUCKET_NAME,
      Key: DEFAULT_AVATAR_KEY,
      Body: avatarBuffer,
      ContentType: "image/png",
      CacheControl: "public, max-age=31536000",
    });

    await s3Client.send(uploadCommand);
    console.log(`✅ Default avatar uploaded to S3: ${DEFAULT_AVATAR_KEY}`);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.warn(`⚠️ Avatar file not found at ${getAvatarFilePath()}, skipping upload`);
      return;
    }
    throw error;
  }
};