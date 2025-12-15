import multer from "multer";
import path from "path";
import { ALLOWED_IMAGE_TYPES, FILE_SIZE_LIMITS } from "./upload.constants";
import { createStorage, getUploadsDir, ensureDirectoryExists, getSubfolderByMimeType } from "./upload.utils";

const storage = createStorage((req, file, cb) => {
  const uploadsDir = getUploadsDir();
  const subfolder = getSubfolderByMimeType(file.mimetype);
  const folderPath = path.join(uploadsDir, subfolder);
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