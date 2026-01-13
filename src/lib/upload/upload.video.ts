import multer from "multer";
import path from "path";
import { ALLOWED_VIDEO_TYPES, FILE_SIZE_LIMITS } from "./upload.constants";
import { createS3Storage } from "./upload.s3";
import { isS3Configured } from "../../config/s3.env";
import { createStorage, getUploadsDir, ensureDirectoryExists } from "./upload.utils";

// Use S3 storage if configured, otherwise fall back to local disk storage
const storage = isS3Configured()
  ? createS3Storage("videos")
  : createStorage((_req, file, cb) => {
      const uploadsDir = getUploadsDir();
      const folderPath = path.join(uploadsDir, "videos");
      ensureDirectoryExists(folderPath);
      cb(null, folderPath);
    });

const videoFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only video files (mp4, mpeg, mov, avi) are allowed"));
  }
};

export const uploadVideo = multer({
  storage,
  fileFilter: videoFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.VIDEO,
  },
});