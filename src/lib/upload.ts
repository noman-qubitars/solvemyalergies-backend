import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");
const profileDir = path.join(uploadsDir, "profile");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = "files";
    
    if (file.mimetype.startsWith("image/")) {
      subfolder = "images";
    } else if (file.mimetype === "application/pdf") {
      subfolder = "pdfs";
    } else if (file.mimetype.startsWith("audio/")) {
      subfolder = "voice";
    } else if (file.mimetype.startsWith("video/")) {
      subfolder = "videos";
    } else {
      subfolder = "documents";
    }
    
    const folderPath = path.join(uploadsDir, subfolder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  const allowedAudioTypes = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/ogg", "audio/webm"];
  const allowedVideoTypes = ["video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo"];
  const allowedDocTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  if (
    allowedImageTypes.includes(file.mimetype) ||
    allowedAudioTypes.includes(file.mimetype) ||
    allowedVideoTypes.includes(file.mimetype) ||
    allowedDocTypes.includes(file.mimetype)
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
    fileSize: 100 * 1024 * 1024, // 100MB for videos
  },
});

export const uploadVideo = multer({
  storage,
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedVideoTypes = ["video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo"];
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only video files (mp4, mpeg, mov, avi) are allowed"));
    }
  },
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
});

const profileImageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only image files (png, jpg, jpeg, webp, gif) are allowed"));
  }
};

export const uploadProfileImage = multer({
  storage,
  fileFilter: profileImageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for profile images
  },
});

// Image filter for quiz photo field
const quizImageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type for photo. Only image files (png, jpg, jpeg, webp, gif) are allowed"));
  }
};

const imageSizeLimit = 20 * 1024 * 1024; // 20MB total for all images combined
const perImageLimit = 20 * 1024 * 1024; // 20MB per individual image (max single file size)

const quizImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderPath = path.join(uploadsDir, "images");
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

export const uploadQuizImage = multer({
  storage: quizImageStorage,
  fileFilter: quizImageFilter,
  limits: {
    fileSize: perImageLimit, // Per file limit (max single file can be 20MB)
  },
});

const fileSizeLimit = 200 * 1024 * 1024;

const quizFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedDocTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ];

  const isDocument = allowedDocTypes.includes(file.mimetype);

  if (!isDocument) {
    return cb(new Error("Invalid file type. Only PDF and document files are allowed. Images, voice, and video files are not permitted."));
  }

  if (file.size && file.size > fileSizeLimit) {
    return cb(new Error("File size exceeds 200MB limit"));
  }

  cb(null, true);
};

const quizStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = "documents";
    
    if (file.mimetype === "application/pdf") {
      subfolder = "pdfs";
    } else {
      subfolder = "documents";
    }
    
    const folderPath = path.join(uploadsDir, subfolder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

export const uploadQuiz = multer({
  storage: quizStorage,
  fileFilter: quizFileFilter,
  limits: {
    fileSize: fileSizeLimit,
  },
});

/**
 * Middleware wrapper for handling Multer file uploads with proper error handling
 * @param fields Array of field configurations for multer.fields()
 * @param uploadInstance Optional multer instance (defaults to uploadQuiz)
 * @returns Express middleware function
 */
export const handleFileUpload = (
  fields: Array<{ name: string; maxCount: number }>,
  uploadInstance: multer.Multer = uploadQuiz
) => {
  const upload = uploadInstance.fields(fields);
  
  return (req: any, res: any, next: any) => {
    upload(req, res, (err: any) => {
      if (err) {
        console.error('Multer error:', err);
        
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          const allowedFields = fields.map(f => f.name).join("', '");
          return res.status(400).json({
            success: false,
            message: `Unexpected field: ${err.field}. Only '${allowedFields}' fields are allowed.`
          });
        }
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: err.message || "File size exceeds the limit"
          });
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: "Too many files uploaded"
          });
        }
        
        return res.status(400).json({
          success: false,
          message: err.message || "File upload error"
        });
      }
      next();
    });
  };
};

// Combined filter for quiz uploads that validates based on field name
const quizCombinedFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
  const allowedDocTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ];

  // Check field name to determine validation
  if (file.fieldname === 'photo') {
    // Photo field: only images allowed
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type for photo. Only image files (png, jpg, jpeg, webp, gif) are allowed"));
    }
  } else if (file.fieldname === 'file') {
    // File field: only PDFs and documents allowed
    if (allowedDocTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type for file. Only PDF and document files are allowed. Images, voice, and video files are not permitted."));
    }
  } else {
    cb(new Error(`Unexpected field: ${file.fieldname}. Only 'photo' and 'file' fields are allowed.`));
  }
};

// Combined storage for quiz uploads
const quizCombinedStorage = multer.diskStorage({
  destination: (req, file, cb) => {
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
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// Combined multer instance for quiz uploads
const uploadQuizCombined = multer({
  storage: quizCombinedStorage,
  fileFilter: quizCombinedFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // Max 200MB per file (will check totals separately)
  },
});

/**
 * Custom middleware for quiz PATCH API that handles both images (photo) and documents (file)
 * @param photoMaxCount Maximum number of photo files
 * @param fileMaxCount Maximum number of file documents
 * @returns Express middleware function
 */
export const handleQuizFileUpload = (
  photoMaxCount: number = 10,
  fileMaxCount: number = 10
) => {
  const totalPhotoSizeLimit = 20 * 1024 * 1024; // 20MB total for all photos
  const totalFileSizeLimit = 200 * 1024 * 1024; // 200MB total for all files
  
  const upload = uploadQuizCombined.fields([
    { name: 'photo', maxCount: photoMaxCount },
    { name: 'file', maxCount: fileMaxCount }
  ]);
  
  return (req: any, res: any, next: any) => {
    upload(req, res, (err: any) => {
      if (err) {
        console.error('Multer error:', err);
        
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: `Unexpected field: ${err.field}. Only 'photo' and 'file' fields are allowed.`
          });
        }
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: err.message || "File size exceeds the limit"
          });
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: "Too many files uploaded"
          });
        }
        
        return res.status(400).json({
          success: false,
          message: err.message || "File upload error"
        });
      }
      
      // Check total size limits after all files are uploaded
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      
      if (files && files.photo && files.photo.length > 0) {
        const totalPhotoSize = files.photo.reduce((sum, file) => sum + (file.size || 0), 0);
        if (totalPhotoSize > totalPhotoSizeLimit) {
          return res.status(400).json({
            success: false,
            message: `Total size of all photos exceeds 20MB limit. Current total: ${(totalPhotoSize / (1024 * 1024)).toFixed(2)}MB`
          });
        }
      }
      
      if (files && files.file && files.file.length > 0) {
        const totalFileSize = files.file.reduce((sum, file) => sum + (file.size || 0), 0);
        if (totalFileSize > totalFileSizeLimit) {
          return res.status(400).json({
            success: false,
            message: `Total size of all files exceeds 200MB limit. Current total: ${(totalFileSize / (1024 * 1024)).toFixed(2)}MB`
          });
        }
      }
      
      next();
    });
  };
};