import multer from "multer";
import multerS3 from "multer-s3";
import { ALLOWED_IMAGE_TYPES, ALLOWED_DOC_TYPES, FILE_SIZE_LIMITS } from "./upload.constants";
import { s3Client, createS3Storage } from "./upload.s3";
import { config } from "../../config/env";
import { generateUniqueFilename } from "./upload.utils";

// Use S3 storage only - local storage is not supported
const quizImageStorage = createS3Storage("images");

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

// Use S3 storage only - local storage is not supported
const quizStorage = multerS3({
  s3: s3Client!,
  bucket: config.s3.S3_BUCKET_NAME!,
  key: (_req: any, file: Express.Multer.File, cb: (error: Error | null, key: string) => void) => {
    let subfolder = "documents";
    if (file.mimetype === "application/pdf") {
      subfolder = "pdfs";
    }
    const filename = generateUniqueFilename(file.originalname);
    const key = `uploads/${subfolder}/${filename}`;
    cb(null, key);
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
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

// Use S3 storage only - local storage is not supported
const quizCombinedStorage = multerS3({
  s3: s3Client!,
  bucket: config.s3.S3_BUCKET_NAME!,
  key: (_req: any, file: Express.Multer.File, cb: (error: Error | null, key: string) => void) => {
    let subfolder = "documents";
    
    if (file.fieldname === 'photo') {
      subfolder = "images";
    } else if (file.fieldname === 'file') {
      if (file.mimetype === "application/pdf") {
        subfolder = "pdfs";
      } else {
        subfolder = "documents";
      }
    }
    
    const filename = generateUniqueFilename(file.originalname);
    const key = `uploads/${subfolder}/${filename}`;
    cb(null, key);
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
});

const uploadQuizCombined = multer({
  storage: quizCombinedStorage,
  fileFilter: quizCombinedFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.QUIZ_FILE,
  },
});

export { uploadQuizCombined };