export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
export const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/ogg", "audio/webm"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo"];
export const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

export const FILE_SIZE_LIMITS = {
  GENERAL: 100 * 1024 * 1024,
  VIDEO: 500 * 1024 * 1024,
  PROFILE_IMAGE: 5 * 1024 * 1024,
  QUIZ_IMAGE_PER_FILE: 20 * 1024 * 1024,
  QUIZ_IMAGE_TOTAL: 20 * 1024 * 1024,
  QUIZ_FILE: 200 * 1024 * 1024,
  QUIZ_FILE_TOTAL: 200 * 1024 * 1024,
};