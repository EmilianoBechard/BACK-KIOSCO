import dotenv from "dotenv";
dotenv.config();
import { AdminModel } from "../models/AdminModel.js";
import {
  validCategories,
  validPartialProduct,
  validProducts,
} from "../schemas/validProducts.js";
import { validUsersLogin } from "../schemas/validUsers.js";
import { uploadImageToCloudinary } from "../utils/uploadImage.js";
import jwt from "jsonwebtoken";
import { capitalizeFirstLetter, generateSlug } from "../utils/utils.js";
import multer from "multer";
import { deleteImageFromCloudinary } from "../utils/deleteImage.js";
import {
  ConflictError,
  DatabaseError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../utils/errors.js";
import bcrypt from "bcrypt";

const storage = multer.memoryStorage();

export const upload = multer({ storage });

export class AdminController {
  static async loginAdmin(req, res) {
    const result = validUsersLogin(req.body);
    if (!result.success) {
      const firstErrorMessage =
        result.error?.issues?.[0].message || "Error de validacion";
      return res.status(400).json({ error: firstErrorMessage });
    }

    const { email, contraseña } = result.data;
    try {
      const adminLogin = await AdminModel.loginUser({
        email,
      });

      if (!adminLogin) throw new NotFoundError("Usuario no encontrado");

      const isValid = await bcrypt.compare(contraseña, adminLogin.contraseña);
      if (!isValid) throw new UnauthorizedError("Contraseña invalida");

      const {
        contraseña: _,
        id_usuario,
        id_perfil,
        ...publicAdminLogin
      } = adminLogin;

      const token = jwt.sign(
        {
          id_usuario: adminLogin.id_usuario,
          nombre: adminLogin.nombre,
          apellido: adminLogin.apellido,
          email: adminLogin.email,
        },
        process.env.JWT_KEY_TOKEN,
        {
          expiresIn: "1h",
        }
      );

      res
        .cookie("access_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Lax",
          maxAge: 1000 * 60 * 60,
        })
        .send({ publicAdminLogin });
    } catch (e) {
      if (e instanceof NotFoundError)
        return res.status(404).json({ error: e.message });
      if (e instanceof UnauthorizedError)
        return res.status(401).json({ error: e.message });
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  static async adminLogout(req, res) {
    res
      .clearCookie("access_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
      })
      .json({ message: "Logout successful", logout: true });
  }

  static async getProducts(req, res) {
    try {
      const products = await AdminModel.getProductos();
      return res.status(200).json({ productos: products });
    } catch (e) {
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  static async createProducts(req, res) {
    let uploadedImage = null;
    try {
      if (!req.file) throw new ValidationError("Debe subir una imagen");

      if (req.body.precio) req.body.precio = Number(req.body.precio);
      if (req.body.stock) req.body.stock = Number(req.body.stock);

      req.body.destacado =
        req.body.destacado === "true" || req.body.destacado === true;
      req.body.carousel =
        req.body.carousel === "true" || req.body.carousel === true;
      req.body.activo = req.body.activo === "true" || req.body.activo === true;

      const result = validProducts(req.body);
      if (!result.success)
        throw new ValidationError(result.error.issues[0].message);

      const { nombre } = result.data;

      const nameRepeat = await AdminModel.getProductoExists(nombre);
      if (nameRepeat)
        throw new ConflictError("Ya existe un producto con ese nombre");

      const { url, public_id } = await uploadImageToCloudinary(req.file.buffer);
      uploadedImage = { url, public_id };

      const newProduct = await AdminModel.createProducto(
        result.data,
        url,
        public_id
      );
      if (!newProduct) throw new DatabaseError("No se pudo crear el producto");
      return res.status(201).json(newProduct);
    } catch (e) {
      if (uploadedImage?.public_id) {
        try {
          await deleteImageFromCloudinary(uploadedImage.public_id);
        } catch (err) {
          console.error("No se pudo borrar la imagen subida por error");
        }
      }
      if (e instanceof ValidationError)
        return res.status(400).json({ error: e.message });
      if (e instanceof ConflictError)
        return res.status(409).json({ error: e.message });
      if (e instanceof DatabaseError)
        return res.status(500).json({ error: e.message });

      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  static async patchProduct(req, res) {
    let uploadedImage = null;
    try {
      if (req.body.precio) req.body.precio = Number(req.body.precio);
      if (req.body.stock) req.body.stock = Number(req.body.stock);
      if (req.body.sumarStock)
        req.body.sumarStock = Number(req.body.sumarStock);
      if (req.body.restarStock)
        req.body.restarStock = Number(req.body.restarStock);

      req.body.destacado =
        req.body.destacado === "true" || req.body.destacado === true;
      req.body.carousel =
        req.body.carousel === "true" || req.body.carousel === true;
      req.body.activo = req.body.activo === "true" || req.body.activo === true;

      const result = validPartialProduct(req.body);
      if (!result.success)
        throw new ValidationError(result.error.issues[0].message);

      const { id } = req.params;
      if (!id) throw new ValidationError("Falta el id del producto");

      const producto = await AdminModel.getProductoById(id);
      if (!producto) throw new NotFoundError("Producto no encontrado");
      if (result.data.nombre !== producto.nombre) {
        const nameRepeat = await AdminModel.getProductoExists(
          result.data.nombre
        );
        if (nameRepeat)
          throw new ConflictError("Ya existe un producto con ese nombre");
      }

      const nombre = result.data.nombre ?? producto.nombre;
      const descripcion = result.data.descripcion
        ? capitalizeFirstLetter(result.data.descripcion)
        : producto.descripcion;
      const id_categoria = result.data.id_categoria ?? producto.id_categoria;
      const precio = result.data.precio ?? producto.precio;
      const slug = result.data.nombre ? generateSlug(nombre) : producto.slug;
      const destacado = result.data.destacado ?? producto.destacado;
      const carousel = result.data.carousel ?? producto.carousel;
      const activo = result.data.activo ?? producto.activo;

      let stock = producto.stock;
      if (req.body.stock != null) stock = req.body.stock;
      if (req.body.sumarStock != null) stock += req.body.sumarStock;
      if (req.body.restarStock != null) {
        if (stock - req.body.restarStock < 0)
          throw new ValidationError(
            `No se puede restar ${req.body.restarStock} del stock actual (${stock})`
          );
        stock -= req.body.restarStock;
      }

      if (!nombre)
        throw new ValidationError("El nombre del producto es obligatorio");

      const oldImagePublicId = producto.public_id;

      let newImageData = null;
      if (req.file) {
        newImageData = await uploadImageToCloudinary(req.file.buffer);
        uploadedImage = newImageData;
      }

      const inputParaActualizar = {
        nombre,
        descripcion,
        id_categoria,
        stock,
        precio,
        slug,
        destacado,
        carousel,
        activo,
        url: newImageData?.url ?? producto.url,
        public_id: newImageData?.public_id ?? producto.public_id,
      };

      const updatedProduct = await AdminModel.saveProduct(
        id,
        inputParaActualizar
      );
      if (!updatedProduct)
        throw new DatabaseError("No se pudo actualizar el producto");
      if (newImageData && oldImagePublicId) {
        try {
          await deleteImageFromCloudinary(oldImagePublicId);
        } catch (err) {
          console.error("No se pudo borrar la imagen antigua");
        }
      }

      return res.json({
        message: "Cambios aplicados",
        product: updatedProduct,
      });
    } catch (e) {
      if (uploadedImage?.public_id) {
        try {
          await deleteImageFromCloudinary(uploadedImage.public_id);
        } catch (err) {
          console.error("No se pudo borrar la imagen subida por error");
        }
      }
      if (e instanceof ValidationError)
        return res.status(400).json({ error: e.message });
      if (e instanceof NotFoundError)
        return res.status(404).json({ error: e.message });
      if (e instanceof ConflictError)
        return res.status(409).json({ error: e.message });
      if (e instanceof DatabaseError)
        return res.status(500).json({ error: e.message });

      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  static async deleteProduct(req, res) {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Falta el id del producto" });
    }
    try {
      const deletedProduct = await AdminModel.deleteProduct(id);
      if (!deletedProduct)
        throw new DatabaseError("No se pudo eliminar el producto");

      return res.json({ message: "Producto eliminado" });
    } catch (e) {
      if (e instanceof DatabaseError)
        return res.status(500).json({ error: e.message });
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }
  static async getClientes(req, res) {
    try {
      const clients = await AdminModel.getClientes();
      return res.status(200).json({ clientes: clients });
    } catch (e) {
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }
  static async getCategorias(req, res) {
    try {
      const categorias = await AdminModel.getCategorias();
      return res.status(200).json({ categorias });
    } catch (e) {
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }
  static async createCategoria(req, res) {
    try {
      const result = validCategories(req.body);
      if (!result.success)
        throw new ValidationError(result.error.issues[0].message);

      const { categoria } = result.data;

      const categoriaRepeat = await AdminModel.getCategoriaExists(categoria);
      if (categoriaRepeat)
        throw new ConflictError("Ya existe una categoria con ese nombre");

      const newCategoria = await AdminModel.createCategoria(categoria);
      if (!newCategoria)
        throw new DatabaseError("No se pudo crear la categoria");
      return res.status(201).json(newCategoria);
    } catch (e) {
      if (e instanceof ValidationError)
        return res.status(400).json({ error: e.message });
      if (e instanceof ConflictError)
        return res.status(409).json({ error: e.message });
      if (e instanceof DatabaseError)
        return res.status(500).json({ error: e.message });

      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }
  static async deleteCategoria(req, res) {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({ error: "Falta el id de la categoria" });

    try {
      const deletedCategoria = await AdminModel.deleteCategoria(id);
      if (!deletedCategoria)
        throw new DatabaseError("No se pudo eliminar la categoria");

      return res.json({ message: "Categoria eliminada" });
    } catch (e) {
      if (e instanceof DatabaseError)
        return res.status(500).json({ error: e.message });
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }
}
