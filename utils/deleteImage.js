import { cloudinary } from "../cloudinary/cloudinary.js";

export async function deleteImageFromCloudinary(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Error al eliminar imagen de Cloudinary");
  }
}
