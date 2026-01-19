// All uploads are stored in S3 - no local directory creation needed
export { upload } from "./upload.general";
export { uploadVideo } from "./upload.video";
export { uploadProfileImage } from "./upload.profile";
export { uploadQuizImage, uploadQuiz } from "./upload.quiz";
export { handleFileUpload, handleQuizFileUpload } from "./upload.handlers";
export { getDefaultAvatarUrl } from "./upload.avatar";