const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Factory: creates an upload middleware for a given cloudinary folder
const makeUploader = (folder, maxCount = 5) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `smart-marketplace/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Only image files are allowed'), false);
    },
  });

  return {
    single: (fieldName) => upload.single(fieldName),
    multiple: (fieldName) => upload.array(fieldName, maxCount),
  };
};

module.exports = {
  profileUpload: makeUploader('profiles', 1),
  productUpload: makeUploader('products', 8),
  serviceUpload: makeUploader('services', 8),
  chatUpload: makeUploader('chat', 1),
};
