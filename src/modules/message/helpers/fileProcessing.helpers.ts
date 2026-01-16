import { getS3Url } from "../../../lib/upload/upload.s3";

export interface FileInfo {
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

/**
 * Extracts file information from multer file upload
 */
export const extractFileInfo = async (file: Express.Multer.File | undefined): Promise<FileInfo> => {
  if (!file) {
    return {};
  }

  const fileUrl = (file as any).location || getS3Url((file as any).key || file.path);
  const fileName = file.originalname;
  const fileSize = file.size;
  const mimeType = file.mimetype;

  return {
    fileUrl,
    fileName,
    fileSize,
    mimeType,
  };
};