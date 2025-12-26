import multer from "multer";
import { uploadQuiz, uploadQuizCombined } from "./upload.quiz";
import { FILE_SIZE_LIMITS } from "./upload.constants";

export const handleFileUpload = (
  fields: Array<{ name: string; maxCount: number }>,
  uploadInstance: multer.Multer = uploadQuiz
) => {
  const upload = uploadInstance.fields(fields);
  
  return (req: any, res: any, next: any) => {
    upload(req, res, (err: any) => {
      if (err) {
        console.error('Multer error:', err);
        
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          const allowedFields = fields.map(f => f.name).join("', '");
          return res.status(400).json({
            success: false,
            message: `Unexpected field: ${err.field}. Only '${allowedFields}' fields are allowed.`
          });
        }
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: err.message || "File size exceeds the limit"
          });
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: "Too many files uploaded"
          });
        }
        
        return res.status(400).json({
          success: false,
          message: err.message || "File upload error"
        });
      }
      next();
    });
  };
};

export const handleQuizFileUpload = (
  photoMaxCount: number = 10,
  fileMaxCount: number = 10
) => {
  const totalPhotoSizeLimit = FILE_SIZE_LIMITS.QUIZ_IMAGE_TOTAL;
  const totalFileSizeLimit = FILE_SIZE_LIMITS.QUIZ_FILE_TOTAL;
  
  const upload = uploadQuizCombined.fields([
    { name: 'photo', maxCount: photoMaxCount },
    { name: 'file', maxCount: fileMaxCount }
  ]);
  
  return (req: any, res: any, next: any) => {
    upload(req, res, (err: any) => {
      if (err) {
        console.error('Multer error:', err);
        
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: `Unexpected field: ${err.field}. Only 'photo' and 'file' fields are allowed.`
          });
        }
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: err.message || "File size exceeds the limit"
          });
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: "Too many files uploaded"
          });
        }
        
        return res.status(400).json({
          success: false,
          message: err.message || "File upload error"
        });
      }
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      
      if (files && files.photo && files.photo.length > 0) {
        const totalPhotoSize = files.photo.reduce((sum, file) => sum + (file.size || 0), 0);
        if (totalPhotoSize > totalPhotoSizeLimit) {
          return res.status(400).json({
            success: false,
            message: `Total size of all photos exceeds 20MB limit. Current total: ${(totalPhotoSize / (1024 * 1024)).toFixed(2)}MB`
          });
        }
      }
      
      if (files && files.file && files.file.length > 0) {
        const totalFileSize = files.file.reduce((sum, file) => sum + (file.size || 0), 0);
        if (totalFileSize > totalFileSizeLimit) {
          return res.status(400).json({
            success: false,
            message: `Total size of all files exceeds 200MB limit. Current total: ${(totalFileSize / (1024 * 1024)).toFixed(2)}MB`
          });
        }
      }
      
      next();
    });
  };
};