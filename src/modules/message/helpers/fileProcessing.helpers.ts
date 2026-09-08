import { getS3Url } from "../../../lib/upload/upload.s3";
import { convertWebmToM4a } from "../../../lib/audioConversion";

export interface FileInfo {
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

// React Native (iOS in particular) cannot play webm audio, so voice
// messages recorded as webm are converted to m4a right after upload.
const WEBM_AUDIO_MIME_TYPES = ["audio/webm"];

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

  if (WEBM_AUDIO_MIME_TYPES.includes(mimeType)) {
    try {
      const converted = await convertWebmToM4a(fileUrl, fileName);
      return {
        fileUrl: converted.fileUrl,
        fileName: converted.fileName,
        fileSize,
        mimeType: converted.mimeType,
      };
    } catch (error: any) {
      console.error("⚠️  Voice message webm->m4a conversion failed, keeping original webm file:", error.message);
    }
  }

  return {
    fileUrl,
    fileName,
    fileSize,
    mimeType,
  };
};