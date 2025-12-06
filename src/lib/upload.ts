import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
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

// Separate upload for videos with larger size limit
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
    fileSize: 500 * 1024 * 1024, // 500MB for videos
  },
});