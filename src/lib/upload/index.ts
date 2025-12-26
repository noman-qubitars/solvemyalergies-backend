import path from "path";
import { getUploadsDir, ensureDirectoryExists } from "./upload.utils";

const uploadsDir = getUploadsDir();
const profileDir = path.join(uploadsDir, "profile");
const thumbnailsDir = path.join(uploadsDir, "thumbnails");

ensureDirectoryExists(uploadsDir);
ensureDirectoryExists(profileDir);
ensureDirectoryExists(thumbnailsDir);

export { upload } from "./upload.general";
export { uploadVideo } from "./upload.video";
export { uploadProfileImage } from "./upload.profile";
export { uploadQuizImage, uploadQuiz } from "./upload.quiz";
export { handleFileUpload, handleQuizFileUpload } from "./upload.handlers";