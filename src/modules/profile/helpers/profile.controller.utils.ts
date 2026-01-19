import { getS3Url } from "../../../lib/upload/upload.s3";

export const extractImagePath = (files: { [fieldname: string]: Express.Multer.File[] } | undefined): string | undefined => {
  if (!files || !files.image || files.image.length === 0) {
    return undefined;
  }
  
  const imageFile = files.image[0];
  const fileAny = imageFile as any;
  
  if (fileAny.location && typeof fileAny.location === 'string') {
    return fileAny.location;
  }
  
  if (fileAny.key && typeof fileAny.key === 'string' && fileAny.key !== 'undefined') {
    return getS3Url(fileAny.key);
  }
  
  if (imageFile.path && typeof imageFile.path === 'string' && !imageFile.path.includes('undefined')) {
    const cleanPath = imageFile.path.startsWith('/') ? imageFile.path.substring(1) : imageFile.path;
    if (cleanPath && cleanPath !== 'undefined') {
      return getS3Url(cleanPath);
    }
  }
  
  if (imageFile.filename && typeof imageFile.filename === 'string' && imageFile.filename !== 'undefined') {
    return getS3Url(`uploads/profile/${imageFile.filename}`);
  }
  
  console.error('Profile image upload: Unable to extract valid image path from file object:', {
    hasLocation: !!fileAny.location,
    hasKey: !!fileAny.key,
    key: fileAny.key,
    filename: imageFile.filename,
    path: imageFile.path,
    originalname: imageFile.originalname
  });
  
  return undefined;
};

export const buildUpdateData = (name?: string, newPassword?: string, imagePath?: string) => {
  const updateData: {
    name?: string;
    newPassword?: string;
    imagePath?: string;
  } = {};

  if (name !== undefined) {
    updateData.name = name;
  }

  if (newPassword) {
    updateData.newPassword = newPassword;
  }

  if (imagePath !== undefined) {
    updateData.imagePath = imagePath;
  }

  return updateData;
};