import dotenv from "dotenv";
dotenv.config();
import { UserModel } from "../models/UserModel.js";
import {
  validUsers,
  validPartialUsers,
  validUsersLogin,
} from "../schemas/validUsers.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { getUserById } from "../utils/checkUser.js";
import {
  ConflictError,
  DatabaseError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../utils/errors.js";
import { normalizeTelefono } from "../utils/utils.js";

export class UserController {
  static async getCategorias(req, res) {
    try {
      const categorias = await UserModel.getCategorias();
      return res.status(200).json({ categorias });
    } catch (e) {
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  static async getProducts(req, res) {
    try {
      const productos = await UserModel.getProductos();
      return res.status(200).json({ productos });
    } catch (e) {
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  static async getSucursales(req, res) {
    try {
      const sucursales = await UserModel.getSucursales();
      return res.status(200).json({ sucursales });
    } catch (e) {
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  static async createUser(req, res) {
    try {
      const result = validUsers(req.body);
      if (!result.success) {
        const firstErrorMessage =
          result.error?.issues?.[0].message || "Error de validacion";
        return res.status(400).json({ error: firstErrorMessage });
      }

      const { nombre, apellido, telefono, email, contraseña } = result.data;
      const telefonoNormalized = normalizeTelefono(telefono);

      const telefonoExists = await UserModel.getUserByTelefono(
        telefonoNormalized
      );

      if (telefonoExists)
        throw new ConflictError("El telefono ya esta registrado");

      const emailExists = await UserModel.getUserExist(email);
      if (emailExists) throw new ConflictError("El email ya está registrado");

      const newUser = await UserModel.createUser({
        nombre,
        apellido,
        email,
        telefono,
        contraseña,
      });
      if (!newUser) throw new DatabaseError("No se pudo crear el usuario");

      return res
        .status(201)
        .json({ message: "Usuario creado con éxito", createUser: true });
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

  static async loginUser(req, res) {
    try {
      const result = validUsersLogin(req.body);
      if (!result.success)
        throw new ValidationError(
          result.error?.issues?.[0].message || "Error de validación"
        );

      const { email, contraseña } = result.data;
      const usuarioLogin = await UserModel.loginUser({ email });

      if (!usuarioLogin) throw new NotFoundError("Usuario no encontrado");

      const isValid = await bcrypt.compare(contraseña, usuarioLogin.contraseña);
      if (!isValid) throw new UnauthorizedError("Contraseña inválida");

      const {
        contraseña: _,
        id_usuario,
        id_perfil,
        ...publicUsuarioLogin
      } = usuarioLogin;

      const token = jwt.sign(
        {
          id_usuario: usuarioLogin.id_usuario,
          nombre: usuarioLogin.nombre,
          apellido: usuarioLogin.apellido,
          email: usuarioLogin.email,
        },
        process.env.JWT_KEY_TOKEN,
        { expiresIn: "1h" }
      );

      res
        .cookie("access_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Lax",
          maxAge: 1000 * 60 * 60,
        })
        .send({ publicUsuarioLogin });
    } catch (e) {
      if (e instanceof ValidationError)
        return res.status(400).json({ error: e.message });
      if (e instanceof NotFoundError)
        return res.status(404).json({ error: e.message });
      if (e instanceof UnauthorizedError)
        return res.status(401).json({ error: e.message });
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  static async editUser(req, res) {
    try {
      const result = validPartialUsers(req.body);

      if (!result.success) {
        return res.status(400).json({ error: result.error.issues[0].message });
      }

      const data = req.user;
      const input = result.data;

      const usuario = await getUserById(data);

      if (!usuario) throw new NotFoundError("Usuario no encontrado");

      const campos = [];
      const valores = [];
      if (
        input.nombre &&
        input.nombre.toLowerCase() === usuario.nombre.toLowerCase()
      )
        throw new ValidationError("El nombre no puede ser igual al actual");

      if (
        input.apellido &&
        input.apellido.toLowerCase() === usuario.apellido.toLowerCase()
      )
        throw new ValidationError("El apellido no puede ser igual al actual");
      if (input.telefono) {
        const telefonoNormalizedInput = normalizeTelefono(input.telefono);
        const telefonoNormalizedUsuario = normalizeTelefono(usuario.telefono);

        if (
          Number(telefonoNormalizedInput) === Number(telefonoNormalizedUsuario)
        ) {
          throw new ValidationError("El teléfono no puede ser igual al actual");
        }

        const telefonoExists = await UserModel.getUserByTelefono(
          telefonoNormalizedInput
        );
        if (telefonoExists) {
          throw new ConflictError("El teléfono ya está registrado");
        }
      }
      if (input.email) {
        if (input.email.toLowerCase() === usuario.email.toLowerCase())
          throw new ValidationError("El email no puede ser igual al actual");
        const emailExists = await UserModel.getUserExist(input.email);
        if (emailExists) throw new ConflictError("El email ya está registrado");
      }

      if (input.contraseñaNueva && !input.contraseñaActual)
        throw new ValidationError(
          "Para actualizar la contraseña debe ingresar la contraseña actual"
        );

      if (input.nombre) {
        campos.push("nombre = ?");
        valores.push(input.nombre);
      }
      if (input.apellido) {
        campos.push("apellido = ?");
        valores.push(input.apellido);
      }
      if (input.telefono) {
        campos.push("telefono = ?");
        valores.push(input.telefono);
      }
      if (input.email) {
        campos.push("email = ?");
        valores.push(input.email);
      }

      if (input.contraseñaNueva && input.contraseñaActual) {
        const isValid = await bcrypt.compare(
          input.contraseñaActual,
          usuario.contraseña
        );
        if (!isValid)
          throw new UnauthorizedError("La contraseña actual es incorrecta");

        const hashed = await bcrypt.hash(input.contraseñaNueva, 10);
        campos.push("contraseña = ?");
        valores.push(hashed);
      }

      if (campos.length === 0)
        throw new ValidationError(
          "No se realizaron cambios, envía al menos un campo diferente"
        );

      valores.push(usuario.id_usuario);

      const editedUser = await UserModel.editUser(campos, valores, usuario);

      const {
        contraseña: _,
        id_usuario,
        id_perfil,
        ...publicUsuarioEdited
      } = editedUser;

      const token = jwt.sign(
        {
          id_usuario: editedUser.id_usuario,
          nombre: editedUser.nombre,
          apellido: editedUser.apellido,
          email: editedUser.email,
        },
        process.env.JWT_KEY_TOKEN,
        { expiresIn: "1h" }
      );

      res.clearCookie("access_token");
      res.cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        maxAge: 1000 * 60 * 60,
      });

      return res.json({
        message: "Usuario actualizado correctamente",
        publicUsuarioEdited,
      });
    } catch (e) {
      if (e instanceof ValidationError)
        return res.status(400).json({ error: e.message });
      if (e instanceof NotFoundError)
        return res.status(404).json({ error: e.message });
      if (e instanceof ConflictError)
        return res.status(409).json({ error: e.message });
      if (e instanceof UnauthorizedError)
        return res.status(401).json({ error: e.message });
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  static async deleteUser(req, res) {
    try {
      const result = validPartialUsers(req.body);
      if (!result.success)
        throw new ValidationError(
          result.error?.issues?.[0]?.message || "Error de validación"
        );

      const data = req.user;
      const input = result.data;
      const deletedUser = await UserModel.deleteUser({ data, input });

      if (!deletedUser) throw new NotFoundError("Usuario no encontrado");

      res.clearCookie("access_token");
      return res.json({ message: "Cuenta eliminada" });
    } catch (e) {
      if (e instanceof ValidationError)
        return res.status(400).json({ error: e.message });
      if (e instanceof NotFoundError)
        return res.status(404).json({ error: e.message });
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  static async logoutUser(req, res) {
    res
      .clearCookie("access_token")
      .json({ message: "Logout successful", logout: true });
  }
}
