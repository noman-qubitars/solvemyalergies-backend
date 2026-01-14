import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  CompletedPart,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "./upload.s3";
import { config } from "../../config/env";
import { generateUniqueFilename, getSubfolderByMimeType } from "./upload.utils";
import { getS3Url } from "./upload.s3";

const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB per chunk

export interface InitiateUploadResponse {
  uploadId: string;
  key: string;
  chunkSize: number;
  presignedUrls: string[];
  totalParts: number;
}

export interface CompleteUploadParts {
  partNumber: number;
  etag: string;
}

/**
 * Initiates a multipart upload to S3
 * @param filename Original filename
 * @param mimetype File MIME type
 * @param totalSize Total file size in bytes
 * @param subfolder Optional subfolder (e.g., "videos")
 * @returns Upload ID, key, and presigned URLs for each chunk
 */
export const initiateMultipartUpload = async (
  filename: string,
  mimetype: string,
  totalSize: number,
  subfolder?: string
): Promise<InitiateUploadResponse> => {
  if (!s3Client || !config.s3.S3_BUCKET_NAME) {
    throw new Error("S3 is not configured");
  }

  // Generate unique filename and S3 key
  const uniqueFilename = generateUniqueFilename(filename);
  const folder = subfolder || getSubfolderByMimeType(mimetype);
  const key = `uploads/${folder}/${uniqueFilename}`;

  // Calculate number of parts needed
  const totalParts = Math.ceil(totalSize / CHUNK_SIZE);

  // Create multipart upload
  const createCommand = new CreateMultipartUploadCommand({
    Bucket: config.s3.S3_BUCKET_NAME,
    Key: key,
    ContentType: mimetype,
  });

  const { UploadId } = await s3Client.send(createCommand);

  if (!UploadId) {
    throw new Error("Failed to create multipart upload");
  }

  // Generate presigned URLs for each part
  const presignedUrls: string[] = [];
  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const uploadPartCommand = new UploadPartCommand({
      Bucket: config.s3.S3_BUCKET_NAME,
      Key: key,
      PartNumber: partNumber,
      UploadId: UploadId,
    });

    const presignedUrl = await getSignedUrl(s3Client, uploadPartCommand, {
      expiresIn: 3600, // 1 hour
    });

    presignedUrls.push(presignedUrl);
  }

  return {
    uploadId: UploadId,
    key,
    chunkSize: CHUNK_SIZE,
    presignedUrls,
    totalParts,
  };
};

/**
 * Completes a multipart upload
 * @param uploadId Upload ID from initiateMultipartUpload
 * @param key S3 key from initiateMultipartUpload
 * @param parts Array of completed parts with ETags
 * @returns Final S3 URL of the uploaded file
 */
export const completeMultipartUpload = async (
  uploadId: string,
  key: string,
  parts: CompleteUploadParts[]
): Promise<string> => {
  if (!s3Client || !config.s3.S3_BUCKET_NAME) {
    throw new Error("S3 is not configured");
  }

  // Sort parts by part number
  const sortedParts = parts.sort((a, b) => a.partNumber - b.partNumber);

  // Convert to CompletedPart format
  const completedParts: CompletedPart[] = sortedParts.map((part) => ({
    PartNumber: part.partNumber,
    ETag: part.etag,
  }));

  // Complete the multipart upload
  const completeCommand = new CompleteMultipartUploadCommand({
    Bucket: config.s3.S3_BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: completedParts,
    },
  });

  await s3Client.send(completeCommand);

  // Return the final S3 URL
  return getS3Url(key);
};

/**
 * Aborts a multipart upload
 * @param uploadId Upload ID to abort
 * @param key S3 key
 */
export const abortMultipartUpload = async (
  uploadId: string,
  key: string
): Promise<void> => {
  if (!s3Client || !config.s3.S3_BUCKET_NAME) {
    throw new Error("S3 is not configured");
  }

  const abortCommand = new AbortMultipartUploadCommand({
    Bucket: config.s3.S3_BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
  });

  await s3Client.send(abortCommand);
};

