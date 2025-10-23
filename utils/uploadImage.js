import { cloudinary } from "../cloudinary/cloudinary.js";
import streamifier from "streamifier";

export const uploadImageToCloudinary = (fileBuffer, folder = "productos") => {
  return new Promise((resolve, reject) => {
    const buffer = Buffer.isBuffer(fileBuffer)
      ? fileBuffer
      : Buffer.from(fileBuffer);

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    // Convertir el buffer en stream y pipe al uploadStream
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};
