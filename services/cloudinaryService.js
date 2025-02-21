import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // Function to upload an image to Cloudinary
  async uploadToCloudinary(buffer) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "uploads", resource_type: "image" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      Readable.from(buffer).pipe(uploadStream);
    });
  }
}

export default new CloudinaryService();
