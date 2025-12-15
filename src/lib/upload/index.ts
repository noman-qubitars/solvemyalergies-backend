import path from "path";
import { getUploadsDir, ensureDirectoryExists } from "./upload.utils";

const uploadsDir = getUploadsDir();
const profileDir = path.join(uploadsDir, "profile");

ensureDirectoryExists(uploadsDir);
ensureDirectoryExists(profileDir);

export { upload } from "./upload.general";
export { uploadVideo } from "./upload.video";
export { uploadProfileImage } from "./upload.profile";
export { uploadQuizImage, uploadQuiz } from "./upload.quiz";
export { handleFileUpload, handleQuizFileUpload } from "./upload.handlers";