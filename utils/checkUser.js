import { connectionAdmin, connectionUser } from "../utils/database.js";

export async function checkUser(data) {
  const [checkUsuario] = await connectionUser.query(
    "SELECT * FROM Usuarios WHERE id_perfil = ? AND id_usuario = ? AND nombre = ? AND apellido = ? AND email = ? LIMIT 1",
    [1, data.id_usuario, data.nombre, data.apellido, data.email]
  );
  return checkUsuario.length === 1;
}

export async function getUserById(data) {
  const [usuario] = await connectionAdmin.query(
    "SELECT * FROM Usuarios WHERE id_usuario = ? LIMIT 1",
    [data.id_usuario]
  );
  return usuario[0];
}

export async function getUserByEmail(email) {
  const [usuario] = await connectionAdmin.query(
    "SELECT * FROM Usuarios WHERE lower(email) = ? LIMIT 1",
    [email.toLowerCase()]
  );
  return usuario[0];
}
