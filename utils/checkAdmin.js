import { connectionAdmin } from "../utils/database.js";

export async function checkAdminUser(data) {
  const [adminUsuario] = await connectionAdmin.query(
    "SELECT * FROM Usuarios WHERE id_perfil = ? AND id_usuario = ? AND nombre = ? AND apellido = ? AND email = ? LIMIT 1",
    [2, data.id_usuario, data.nombre, data.apellido, data.email]
  );
  return adminUsuario.length === 1;
}
