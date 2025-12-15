export const extractImagePath = (files: { [fieldname: string]: Express.Multer.File[] } | undefined): string | undefined => {
  if (files && files.image && files.image.length > 0) {
    const imageFile = files.image[0];
    return `/uploads/images/${imageFile.filename}`;
  }
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