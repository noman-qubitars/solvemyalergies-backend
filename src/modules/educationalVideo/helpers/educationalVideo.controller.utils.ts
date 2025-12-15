import fs from "fs";
import path from "path";

export const parseVideoStatus = (status: string | undefined): "uploaded" | "draft" | undefined => {
  if (!status) return undefined;
  if (status === "published") return "uploaded";
  return status as "uploaded" | "draft" | undefined;
};

export const parsePaginationParams = (
  page: string | undefined,
  pageSize: string | undefined
): { page?: number; pageSize?: number; error?: string } => {
  const pageNumber = page ? parseInt(page, 10) : undefined;
  const pageSizeNumber = pageSize ? parseInt(pageSize, 10) : undefined;

  if (pageNumber !== undefined && (isNaN(pageNumber) || pageNumber < 1)) {
    return { error: "Invalid page number" };
  }

  if (pageSizeNumber !== undefined && (isNaN(pageSizeNumber) || pageSizeNumber < 1)) {
    return { error: "Invalid page size" };
  }

  return { page: pageNumber, pageSize: pageSizeNumber };
};

export const buildVideoUrl = (filePath: string): string => {
  const normalizedPath = filePath.replace(/\\/g, "/");
  return `/uploads/${normalizedPath.split("uploads/")[1]}`;
};

export const buildFilePath = (videoUrl: string): string => {
  return path.join(
    process.cwd(),
    "uploads",
    videoUrl.replace("/uploads/", "")
  );
};

export const deleteFileIfExists = (filePath: string): void => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

export const buildUpdateData = (
  title?: string,
  description?: string,
  status?: string,
  file?: Express.Multer.File
): {
  title?: string;
  description?: string;
  status?: "uploaded" | "draft";
  videoUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
} => {
  const updateData: {
    title?: string;
    description?: string;
    status?: "uploaded" | "draft";
    videoUrl?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  } = {};

  if (title) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (status) {
    const parsedStatus = parseVideoStatus(status);
    if (parsedStatus) updateData.status = parsedStatus;
  }

  if (file) {
    updateData.videoUrl = buildVideoUrl(file.path);
    updateData.fileName = file.originalname;
    updateData.fileSize = file.size;
    updateData.mimeType = file.mimetype;
  }

  return updateData;
};