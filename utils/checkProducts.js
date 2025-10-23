import { connectionUser } from "../utils/database.js";

export async function getProductosPorIds(ids) {
  const [rows] = await connectionUser.query(
    `SELECT id_producto, nombre, precio, activo, stock 
     FROM Productos 
     WHERE id_producto IN (?) `,
    [ids]
  );
  return rows;
}
