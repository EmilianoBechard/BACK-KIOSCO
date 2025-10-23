import bcrypt from "bcrypt";
import { connectionUser } from "../utils/database.js";
import { DatabaseError, ValidationError } from "../utils/errors.js";
import { normalizeTelefono } from "../utils/utils.js";

export class UserModel {
  static async getCategorias() {
    const [categorias] = await connectionUser.query(
      "SELECT * FROM Categorias ORDER BY id_categoria ASC"
    );
    return categorias;
  }
  static async getProductos() {
    const [productos] = await connectionUser.query(
      "SELECT p.id_producto,p.nombre,p.descripcion,c.categoria,p.stock,p.precio,p.slug,p.destacado,p.carousel,p.activo = 1 AS activo,p.url FROM Productos p JOIN Categorias c ON p.id_categoria = c.id_categoria ORDER BY p.id_producto ASC"
    );
    return productos;
  }
  static async getSucursales() {
    const [sucursales] = await connectionUser.query(
      "SELECT * FROM Sucursal ORDER BY id_sucursal ASC"
    );
    return sucursales;
  }
  static async getUserExist(email) {
    if (!email) throw new ValidationError("Email no definido");
    const lowerCaseEmail = String(email).toLowerCase();

    const [userExists] = await connectionUser.query(
      "SELECT * FROM Usuarios WHERE lower(email) = ? AND id_perfil = ? LIMIT 1;",
      [lowerCaseEmail, 1]
    );

    return userExists.length > 0;
  }
  static async getUserByTelefono(telefono) {
    const normalized = normalizeTelefono(telefono);
    const [rows] = await connectionUser.query(
      "SELECT * FROM Usuarios WHERE REPLACE(telefono, '0', '') = ? LIMIT 1",
      [normalized]
    );
    return rows[0] || null;
  }

  static async createUser({ nombre, apellido, telefono, email, contraseña }) {
    const hashedContraseña = await bcrypt.hash(contraseña, 10);

    await connectionUser.query("BEGIN");

    try {
      await connectionUser.query(
        "INSERT INTO Usuarios(id_perfil, nombre, apellido, telefono, email, contraseña) VALUES(?, ?, ?, ?, ?, ?);",
        [1, nombre, apellido, telefono, email, hashedContraseña]
      );

      const [usuarioCreado] = await connectionUser.query(
        "SELECT * FROM Usuarios WHERE lower(email) = ? LIMIT 1;",
        [email.toLowerCase()]
      );

      if (usuarioCreado.length === 0) {
        await connectionUser.query("ROLLBACK");
        throw new DatabaseError("No se pudo crear el usuario");
      }

      await connectionUser.query("COMMIT");
      return usuarioCreado[0];
    } catch (e) {
      await connectionUser.query("ROLLBACK");
      throw new DatabaseError("Ocurrió un error al crear el usuario");
    }
  }

  static async loginUser({ email }) {
    const [rows] = await connectionUser.query(
      "SELECT * FROM Usuarios WHERE id_perfil = ? AND lower(email) = ? LIMIT 1;",
      [1, email.toLowerCase()]
    );
    const usuarioLogin = rows[0];
    return usuarioLogin;
  }

  static async editUser(campos, valores, usuario) {
    try {
      await connectionUser.query(
        `UPDATE Usuarios SET ${campos.join(", ")} WHERE id_usuario = ?`,
        valores
      );

      const [updated] = await connectionUser.query(
        "SELECT * FROM Usuarios WHERE id_usuario = ? LIMIT 1",
        [usuario.id_usuario]
      );

      if (updated.length === 0)
        throw new DatabaseError("No se pudo actualizar el usuario");

      return updated[0];
    } catch (e) {
      throw new DatabaseError("Ocurrió un error al actualizar el usuario");
    }
  }

  static async deleteUser({ data, input }) {
    const [rows] = await connectionUser.query(
      "SELECT * FROM Usuarios WHERE id_usuario = ? AND id_perfil = ? LIMIT 1",
      [data.id_usuario, 1]
    );

    if (rows.length === 0) return false;

    const usuario = rows[0];

    const isValid = await bcrypt.compare(input.contraseña, usuario.contraseña);
    if (!isValid) throw new ValidationError("Contraseña inválida");

    await connectionUser.query("BEGIN");

    try {
      await connectionUser.query("DELETE FROM Usuarios WHERE id_usuario = ?;", [
        usuario.id_usuario,
      ]);
      const [check] = await connectionUser.query(
        "SELECT * FROM Usuarios WHERE id_usuario = ? LIMIT 1",
        [usuario.id_usuario]
      );

      if (check.length > 0) {
        await connectionUser.query("ROLLBACK");
        throw new DatabaseError("No se pudo eliminar el usuario");
      }

      await connectionUser.query("COMMIT");
      return true;
    } catch (e) {
      await connectionUser.query("ROLLBACK");
      throw new DatabaseError("Ocurrió un error al eliminar el usuario");
    }
  }
}
