import multer from "multer";
import path from "path";
import { ALLOWED_IMAGE_TYPES, FILE_SIZE_LIMITS } from "./upload.constants";
import { createS3Storage } from "./upload.s3";
import { isS3Configured } from "../../config/s3.env";
import { createStorage, getUploadsDir, ensureDirectoryExists } from "./upload.utils";

// Use S3 storage if configured, otherwise fall back to local disk storage
const storage = isS3Configured()
  ? createS3Storage("profile")
  : createStorage((req, file, cb) => {
      const uploadsDir = getUploadsDir();
      const folderPath = path.join(uploadsDir, "profile");
      ensureDirectoryExists(folderPath);
      cb(null, folderPath);
    });

const profileImageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only image files (png, jpg, jpeg, webp, gif) are allowed"));
  }
};

export const uploadProfileImage = multer({
  storage,
  fileFilter: profileImageFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.PROFILE_IMAGE,
  },
});