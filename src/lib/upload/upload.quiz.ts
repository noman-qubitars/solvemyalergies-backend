import multer from "multer";
import path from "path";
import { ALLOWED_IMAGE_TYPES, ALLOWED_DOC_TYPES, FILE_SIZE_LIMITS } from "./upload.constants";
import { createStorage, getUploadsDir, ensureDirectoryExists } from "./upload.utils";

const quizImageStorage = createStorage((_req, _file, cb) => {
  const uploadsDir = getUploadsDir();
  const folderPath = path.join(uploadsDir, "images");
  ensureDirectoryExists(folderPath);
  cb(null, folderPath);
});

const quizImageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type for photo. Only image files (png, jpg, jpeg, webp, gif) are allowed"));
  }
};

export const uploadQuizImage = multer({
  storage: quizImageStorage,
  fileFilter: quizImageFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.QUIZ_IMAGE_PER_FILE,
  },
});

const quizFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const isDocument = ALLOWED_DOC_TYPES.includes(file.mimetype);

  if (!isDocument) {
    return cb(new Error("Invalid file type. Only PDF and document files are allowed. Images, voice, and video files are not permitted."));
  }

  if (file.size && file.size > FILE_SIZE_LIMITS.QUIZ_FILE) {
    return cb(new Error("File size exceeds 200MB limit"));
  }

  cb(null, true);
};

const quizStorage = createStorage((_req, file, cb) => {
  const uploadsDir = getUploadsDir();
  let subfolder = "documents";
  
  if (file.mimetype === "application/pdf") {
    subfolder = "pdfs";
  }
  
  const folderPath = path.join(uploadsDir, subfolder);
  ensureDirectoryExists(folderPath);
  cb(null, folderPath);
});

export const uploadQuiz = multer({
  storage: quizStorage,
  fileFilter: quizFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.QUIZ_FILE,
  },
});

const quizCombinedFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.fieldname === 'photo') {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type for photo. Only image files (png, jpg, jpeg, webp, gif) are allowed"));
    }
  } else if (file.fieldname === 'file') {
    if (ALLOWED_DOC_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type for file. Only PDF and document files are allowed. Images, voice, and video files are not permitted."));
    }
  } else {
    cb(new Error(`Unexpected field: ${file.fieldname}. Only 'photo' and 'file' fields are allowed.`));
  }
};

const quizCombinedStorage = createStorage((_req, file, cb) => {
  const uploadsDir = getUploadsDir();
  let subfolder = "files";
  
  if (file.fieldname === 'photo') {
    subfolder = "images";
  } else if (file.fieldname === 'file') {
    if (file.mimetype === "application/pdf") {
      subfolder = "pdfs";
    } else {
      subfolder = "documents";
    }
  }
  
  const folderPath = path.join(uploadsDir, subfolder);
  ensureDirectoryExists(folderPath);
  cb(null, folderPath);
});

const uploadQuizCombined = multer({
  storage: quizCombinedStorage,
  fileFilter: quizCombinedFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.QUIZ_FILE,
  },
});

export { uploadQuizCombined };