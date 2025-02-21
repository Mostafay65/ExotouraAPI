import CloudinaryService from "../services/cloudinaryService.js";

//  Middleware to process images asynchronously
export const processImages = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    req.imageUploadPromises = [];
    return next();
  }

  // Store upload promises, but do NOT wait for them to complete
  req.imageUploadPromises = req.files.map((file) =>
    CloudinaryService.uploadToCloudinary(file.buffer)
  );

  next();
};
