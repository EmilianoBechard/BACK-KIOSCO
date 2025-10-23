import { capitalizeFirstLetter, generateSlug } from "../utils/utils.js";
import { connectionAdmin } from "../utils/database.js";
import { deleteImageFromCloudinary } from "../utils/deleteImage.js";
import { DatabaseError } from "../utils/errors.js";

export class AdminModel {
  static async loginUser({ email }) {
    const [rows] = await connectionAdmin.query(
      "SELECT * FROM Usuarios WHERE id_perfil = ? AND lower(email) = ? LIMIT 1;",
      [2, email.toLowerCase()]
    );
    const adminLogin = rows[0];

    return adminLogin;
  }

  static async getProductos() {
    const [productos] = await connectionAdmin.query(
      "SELECT p.id_producto,p.nombre,p.descripcion,c.categoria,p.stock,p.precio,p.slug,p.destacado,p.carousel,p.activo,p.url FROM Productos p JOIN Categorias c ON p.id_categoria = c.id_categoria ORDER BY p.id_producto ASC"
    );
    return productos;
  }

  static async getProductoExists(nombre) {
    const [producto] = await connectionAdmin.query(
      "SELECT * FROM Productos WHERE lower(nombre) = ? LIMIT 1;",
      [nombre.toLowerCase()]
    );
    return producto.length > 0 ? producto[0] : false;
  }
  static async getCategoriaExists(nombre) {
    const [categoria] = await connectionAdmin.query(
      "SELECT * FROM Categorias WHERE lower(categoria) = ? LIMIT 1;",
      [nombre.toLowerCase()]
    );
    return categoria.length > 0 ? categoria[0] : false;
  }
  static async getProductoById(id) {
    const [producto] = await connectionAdmin.query(
      "SELECT * FROM Productos WHERE id_producto = ? LIMIT 1;",
      [id]
    );
    return producto.length > 0 ? producto[0] : false;
  }

  static async createProducto(input, url, public_id) {
    const {
      nombre,
      descripcion,
      id_categoria,
      stock,
      precio,
      destacado,
      carousel,
      activo,
    } = input;

    const newDescription = descripcion
      ? capitalizeFirstLetter(descripcion)
      : "";

    const slug = generateSlug(nombre);

    await connectionAdmin.query("BEGIN");

    try {
      await connectionAdmin.query(
        "INSERT INTO Productos(nombre, descripcion, id_categoria, stock, precio, slug, destacado, carousel, activo, url, public_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        [
          nombre,
          newDescription,
          id_categoria,
          stock,
          precio,
          slug,
          destacado,
          carousel,
          activo,
          url,
          public_id,
        ]
      );
      const [productoCreado] = await connectionAdmin.query(
        "SELECT * FROM Productos WHERE slug = ? LIMIT 1;",
        [slug]
      );
      if (productoCreado.length !== 1) {
        await connectionAdmin.query("ROLLBACK");
        throw new DatabaseError("No se pudo crear el producto");
      }

      await connectionAdmin.query("COMMIT");
      return productoCreado[0];
    } catch (e) {
      await connectionAdmin.query("ROLLBACK");
      throw new DatabaseError("Ocurrió un error al crear el producto");
    }
  }

  static async saveProduct(id, input) {
    await connectionAdmin.query("BEGIN");
    try {
      await connectionAdmin.query(
        `UPDATE Productos
       SET nombre = ?, descripcion = ?, id_categoria = ?, stock = ?, precio = ?, slug = ?, destacado = ?, carousel = ?, activo = ?, url = ?, public_id = ?
       WHERE id_producto = ?;`,
        [
          input.nombre,
          input.descripcion,
          input.id_categoria,
          input.stock,
          input.precio,
          input.slug,
          input.destacado,
          input.carousel,
          input.activo,
          input.url,
          input.public_id,
          id,
        ]
      );

      const [productoEditado] = await connectionAdmin.query(
        "SELECT * FROM Productos WHERE id_producto = ? LIMIT 1;",
        [id]
      );

      if (productoEditado.length !== 1) {
        await connectionAdmin.query("ROLLBACK");
        throw new DatabaseError("No se pudo actualizar el producto");
      }

      await connectionAdmin.query("COMMIT");
      return productoEditado[0];
    } catch (e) {
      await connectionAdmin.query("ROLLBACK");
      throw new DatabaseError("Ocurrió un error al actualizar el producto");
    }
  }

  static async deleteProduct(id) {
    const [productos] = await connectionAdmin.query(
      "SELECT * FROM Productos WHERE id_producto = ? LIMIT 1;",
      [id]
    );
    if (productos.length === 0) return false;

    const producto = productos[0];
    const oldImagePublicId = producto.public_id;

    await connectionAdmin.query("BEGIN");

    try {
      await connectionAdmin.query(
        "DELETE FROM Productos WHERE id_producto = ?;",
        [id]
      );
      const [verificacion] = await connectionAdmin.query(
        "SELECT * FROM Productos WHERE id_producto = ?;",
        [id]
      );

      if (verificacion.length > 0) {
        await connectionAdmin.query("ROLLBACK");
        throw new DatabaseError("No se pudo eliminar el producto");
      }

      await connectionAdmin.query("COMMIT");

      if (oldImagePublicId) {
        try {
          await deleteImageFromCloudinary(oldImagePublicId);
        } catch (err) {
          console.error("No se pudo borrar la imagen");
        }
      }

      return true;
    } catch (e) {
      await connectionAdmin.query("ROLLBACK");
      if (e.errno === 1451)
        throw new DatabaseError(
          "No se puede eliminar el producto porque hay pedidos que lo incluyen",
          e
        );

      throw new DatabaseError("Ocurrió un error al eliminar el producto", e);
    }
  }

  static async getClientes() {
    const [clientes] = await connectionAdmin.query(
      `SELECT 
      u.id_usuario, 
      CONCAT(u.nombre, ' ', u.apellido) AS cliente,
      u.telefono AS telefono,
      u.email, 
      COUNT(ps.id_pedido) AS pedidos,
      MAX(ps.id_pedido) AS ultimo_pedido
   FROM Usuarios u
   LEFT JOIN Pedidos ps ON ps.id_usuario = u.id_usuario
   WHERE u.id_perfil = ?
   GROUP BY u.id_usuario, u.nombre, u.apellido, u.email, u.telefono
   ORDER BY u.id_usuario ASC`,
      [1]
    );
    return clientes;
  }
  static async getCategorias() {
    const [categorias] = await connectionAdmin.query(
      "SELECT * FROM Categorias ORDER BY id_categoria ASC"
    );
    return categorias;
  }
  static async createCategoria(categoria) {
    await connectionAdmin.query("BEGIN");

    try {
      await connectionAdmin.query(
        "INSERT INTO Categorias(categoria) VALUES(?);",
        [categoria]
      );
      const [categoriaCreada] = await connectionAdmin.query(
        "SELECT * FROM Categorias WHERE categoria = ? LIMIT 1;",
        [categoria]
      );
      if (categoriaCreada.length !== 1) {
        await connectionAdmin.query("ROLLBACK");
        throw new DatabaseError("No se pudo crear la categoría");
      }

      await connectionAdmin.query("COMMIT");
      return categoriaCreada[0];
    } catch (e) {
      await connectionAdmin.query("ROLLBACK");
      throw new DatabaseError("Ocurrió un error al crear la categoría");
    }
  }
  static async deleteCategoria(id) {
    const [categoria] = await connectionAdmin.query(
      "SELECT * FROM Categorias WHERE id_categoria = ? LIMIT 1;",
      [id]
    );
    if (categoria.length === 0) return false;

    await connectionAdmin.query("BEGIN");

    try {
      await connectionAdmin.query(
        "DELETE FROM Categorias WHERE id_categoria = ?;",
        [id]
      );

      const [verificacion] = await connectionAdmin.query(
        "SELECT * FROM Categorias WHERE id_categoria = ?;",
        [id]
      );

      if (verificacion.length > 0) {
        await connectionAdmin.query("ROLLBACK");
        throw new DatabaseError("No se pudo eliminar la categoría");
      }

      await connectionAdmin.query("COMMIT");
      return true;
    } catch (e) {
      await connectionAdmin.query("ROLLBACK");
      if (e.errno === 1451)
        throw new DatabaseError(
          "No se puede eliminar el producto porque hay pedidos que lo incluyen",
          e
        );

      throw new DatabaseError("Ocurrió un error al eliminar la categoría");
    }
  }
}
