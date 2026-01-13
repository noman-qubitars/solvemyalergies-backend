import { getS3Url } from "../../../lib/upload/upload.s3";

export const processPhotoFiles = async (
  files: { [fieldname: string]: Express.Multer.File[] } | undefined
): Promise<string[]> => {
  if (!files || !files.photo || files.photo.length === 0) {
    return [];
  }

  return files.photo.map((photoFile) => {
    return (
      (photoFile as any).location ||
      getS3Url((photoFile as any).key || `/uploads/images/${photoFile.filename}`)
    );
  });
};

export const processFileUploads = async (
  files: { [fieldname: string]: Express.Multer.File[] } | undefined
): Promise<string[]> => {
  if (!files || !files.file || files.file.length === 0) {
    return [];
  }

  return files.file.map((file) => {
    const fileSubfolder =
      file.mimetype === "application/pdf" ? "pdfs" : "documents";
    return (
      (file as any).location ||
      getS3Url((file as any).key || `/uploads/${fileSubfolder}/${file.filename}`)
    );
  });
};