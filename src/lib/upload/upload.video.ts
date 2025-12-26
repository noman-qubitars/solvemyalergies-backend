import multer from "multer";
import path from "path";
import { ALLOWED_VIDEO_TYPES, FILE_SIZE_LIMITS } from "./upload.constants";
import { createStorage, getUploadsDir, ensureDirectoryExists, getSubfolderByMimeType } from "./upload.utils";

const storage = createStorage((_req, file, cb) => {
  const uploadsDir = getUploadsDir();
  const subfolder = getSubfolderByMimeType(file.mimetype);
  const folderPath = path.join(uploadsDir, subfolder);
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