import multer from "multer";
import { ALLOWED_VIDEO_TYPES, FILE_SIZE_LIMITS } from "./upload.constants";
import { createS3Storage } from "./upload.s3";

// Use S3 storage only - local storage is not supported
const storage = createS3Storage("videos");

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