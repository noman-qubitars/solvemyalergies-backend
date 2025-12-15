import multer from "multer";
import path from "path";
import fs from "fs";

export const getUploadsDir = () => path.join(process.cwd(), "uploads");

export const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export const getSubfolderByMimeType = (mimetype: string): string => {
  if (mimetype.startsWith("image/")) {
    return "images";
  } else if (mimetype === "application/pdf") {
    return "pdfs";
  } else if (mimetype.startsWith("audio/")) {
    return "voice";
  } else if (mimetype.startsWith("video/")) {
    return "videos";
  } else {
    return "documents";
  }
};

export const generateUniqueFilename = (originalname: string): string => {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const ext = path.extname(originalname);
  const name = path.basename(originalname, ext);
  return `${name}-${uniqueSuffix}${ext}`;
};

export const createStorage = (destination: (req: any, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => void) => {
  return multer.diskStorage({
    destination,
    filename: (req, file, cb) => {
      cb(null, generateUniqueFilename(file.originalname));
    },
  });
};

