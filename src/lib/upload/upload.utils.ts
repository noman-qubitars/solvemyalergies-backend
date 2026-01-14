import path from "path";

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