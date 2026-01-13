import multer from "multer";
import path from "path";
import { ALLOWED_IMAGE_TYPES, ALLOWED_AUDIO_TYPES, ALLOWED_VIDEO_TYPES, ALLOWED_DOC_TYPES, FILE_SIZE_LIMITS } from "./upload.constants";
import { createS3Storage } from "./upload.s3";
import { isS3Configured } from "../../config/s3.env";
import { createStorage, getUploadsDir, ensureDirectoryExists, getSubfolderByMimeType } from "./upload.utils";

// Use S3 storage if configured, otherwise fall back to local disk storage
const storage = isS3Configured()
  ? createS3Storage()
  : createStorage((req, file, cb) => {
      const uploadsDir = getUploadsDir();
      const subfolder = getSubfolderByMimeType(file.mimetype);
      const folderPath = path.join(uploadsDir, subfolder);
      ensureDirectoryExists(folderPath);
      cb(null, folderPath);
    });

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (
    ALLOWED_IMAGE_TYPES.includes(file.mimetype) ||
    ALLOWED_AUDIO_TYPES.includes(file.mimetype) ||
    ALLOWED_VIDEO_TYPES.includes(file.mimetype) ||
    ALLOWED_DOC_TYPES.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Allowed: images (png, jpg, jpeg, webp), audio files, videos (mp4, mpeg, mov, avi), PDFs, and documents"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.GENERAL,
  },
});