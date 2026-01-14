import multer from "multer";
import { ALLOWED_IMAGE_TYPES, FILE_SIZE_LIMITS } from "./upload.constants";
import { createS3Storage } from "./upload.s3";

// Use S3 storage only - local storage is not supported
const storage = createS3Storage("profile");

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