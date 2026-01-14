import multer from "multer";
import { ALLOWED_IMAGE_TYPES, ALLOWED_AUDIO_TYPES, ALLOWED_VIDEO_TYPES, ALLOWED_DOC_TYPES, FILE_SIZE_LIMITS } from "./upload.constants";
import { createS3Storage } from "./upload.s3";

// Use S3 storage only - local storage is not supported
const storage = createS3Storage();

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