import { connectionAdmin } from "./database.js";
import bcrypt from "bcrypt";

async function crearAdmin(nombre, apellido, email, contraseña) {
  try {
    const hashedContraseña = await bcrypt.hash(contraseña, 10);

    await connectionAdmin.query("BEGIN");

    await connectionAdmin.query(
      "INSERT INTO Usuarios(id_perfil, nombre, apellido, email, contraseña) VALUES(?, ?, ?, ?, ?);",
      [2, nombre, apellido, email, hashedContraseña]
    );

    const [adminCreado] = await connectionAdmin.query(
      "SELECT * FROM Usuarios WHERE lower(email) = ? LIMIT 1;",
      [email.toLowerCase()]
    );

    if (adminCreado.length === 1) {
      await connectionAdmin.query("COMMIT");
      console.log("Administrador creado correctamente");
    } else {
      await connectionAdmin.query("ROLLBACK");
      console.log("No se encontro el administrador creado");
    }
  } catch (err) {
    await connectionAdmin.query("ROLLBACK");
    throw new Error(
      "Ocurrió un error al crear el administrador: " + err.message
    );
  }
}

crearAdmin("Emiliano", "Bechard", "administrador123@hotmail.com", "admin123");
