import { connectionAdmin, connectionUser } from "../utils/database.js";
import { DatabaseError } from "../utils/errors.js";

export class PedidosModel {
  static async getPedidoByIdAdmin(id) {
    const [pedidos] = await connectionAdmin.query(
      "SELECT * FROM Pedidos WHERE id_pedido = ? LIMIT 1;",
      [id]
    );
    return pedidos.length > 0;
  }

  static async getPedidoConDetallesAdmin(page, limit, offset, filters) {
    let whereClauses = [];
    let params = [];

    whereClauses.push("ps.id_estado NOT IN (4, 5)");

    if (filters.id_pedido) {
      whereClauses.push("ps.id_pedido = ?");
      params.push(filters.id_pedido);
    }
    if (filters.cliente) {
      whereClauses.push("CONCAT(u.nombre, ' ', u.apellido) LIKE ?");
      params.push(`%${filters.cliente}%`);
    }
    if (filters.fecha) {
      whereClauses.push("ps.fecha >= ?");
      params.push(filters.fecha);
    }
    if (filters.detalle_estado) {
      whereClauses.push("e.detalle_estado LIKE ?");
      params.push(`%${filters.detalle_estado}%`);
    }

    const whereSQL =
      whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

    const [detallePedidos] = await connectionAdmin.query(
      `
            SELECT 
            ps.id_pedido,
            DATE_FORMAT(ps.fecha, '%d/%m/%Y %r') AS fecha,
            ps.precio_total,
            ps.id_estado,
            e.detalle_estado AS detalle_estado,
            CONCAT(u.nombre, ' ', u.apellido) AS cliente,
            u.telefono AS telefono,
            s.direccion AS sucursal,
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id_producto', p.id_producto,
                    'nombre', p.nombre,
                    'slug', p.slug,
                    'cantidad', ds.cantidad
                    )
                    ) AS productos
                    FROM Pedidos ps
                    JOIN Estado e ON ps.id_estado = e.id_estado
                    JOIN Usuarios u ON ps.id_usuario = u.id_usuario
                    JOIN DetallePedidos ds ON ps.id_pedido = ds.id_pedido
                    JOIN Sucursal s ON ps.id_sucursal = s.id_sucursal
                    JOIN Productos p ON ds.id_producto = p.id_producto
                    ${whereSQL}
                    GROUP BY 
                    ps.id_pedido, 
                    ps.fecha, 
                    ps.precio_total, 
                    ps.id_estado, 
                    e.detalle_estado, 
                    u.nombre, u.apellido, u.telefono
                    ORDER BY ps.fecha DESC, ps.id_pedido ASC
                    LIMIT ? OFFSET ?;
                    `,
      [...params, limit, offset]
    );

    const [[{ total }]] = await connectionAdmin.query(
      `
    SELECT COUNT(*) AS total
    FROM Pedidos ps
    JOIN Estado e ON ps.id_estado = e.id_estado
    JOIN Usuarios u ON ps.id_usuario = u.id_usuario
    JOIN DetallePedidos ds ON ps.id_pedido = ds.id_pedido
    JOIN Sucursal s ON ps.id_sucursal = s.id_sucursal
    JOIN Productos p ON ds.id_producto = p.id_producto
    ${whereSQL};
    `,
      params
    );

    return { detallePedidos, total };
  }

  static async getHistorialPedidosAdmin(page, limit, offset, filters) {
    let whereClauses = [];
    let params = [];

    if (filters.id_pedido) {
      whereClauses.push("hp.id_pedido = ?");
      params.push(filters.id_pedido);
    }
    if (filters.cliente) {
      whereClauses.push("CONCAT(cliente.nombre, ' ', cliente.apellido) LIKE ?");
      params.push(`%${filters.cliente}%`);
    }
    if (filters.fecha_pedido_desde) {
      whereClauses.push("p.fecha >= ?");
      params.push(filters.fecha_pedido_desde);
    }
    if (filters.fecha_pedido_hasta) {
      whereClauses.push("p.fecha <= ?");
      params.push(filters.fecha_pedido_hasta);
    }
    if (filters.detalle_estado) {
      whereClauses.push("e.detalle_estado LIKE ?");
      params.push(`%${filters.detalle_estado}%`);
    }
    if (filters.fecha_modificacion_desde) {
      whereClauses.push("hp.fecha_modificacion >= ?");
      params.push(filters.fecha_modificacion_desde);
    }
    if (filters.fecha_modificacion_hasta) {
      whereClauses.push("hp.fecha_modificacion <= ?");
      params.push(filters.fecha_modificacion_hasta);
    }
    if (filters.usuario_modificador) {
      whereClauses.push(
        "CONCAT(modificador.nombre, ' ', modificador.apellido) LIKE ?"
      );
      params.push(`%${filters.usuario_modificador}%`);
    }

    const whereSQL =
      whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

    const [historialPedidos] = await connectionAdmin.query(
      `
    SELECT 
      hp.id_historial,
      hp.id_pedido,
      DATE_FORMAT(p.fecha, '%d/%m/%Y %r') AS fecha_pedido,
      CONCAT(cliente.nombre, ' ', cliente.apellido) AS cliente,
      cliente.telefono AS telefono,
      s.direccion AS sucursal,
      hp.precio_total,
      DATE_FORMAT(hp.fecha_modificacion, '%d/%m/%Y %r') AS fecha_modificacion,
      CONCAT(modificador.nombre, ' ', modificador.apellido) AS usuario_modificador,
      perfil.tipo_perfil AS perfil,
      e.detalle_estado AS detalle_estado,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id_producto', pr.id_producto,
          'nombre', pr.nombre,
          'slug', pr.slug,
          'cantidad', ds.cantidad
        )
      ) AS productos
    FROM HistorialPedidos hp
    JOIN Pedidos p ON hp.id_pedido = p.id_pedido
    JOIN Usuarios cliente ON hp.id_usuario = cliente.id_usuario
    JOIN Usuarios modificador ON hp.id_usuario_modificador = modificador.id_usuario
    JOIN Perfiles perfil ON modificador.id_perfil = perfil.id_perfil
    JOIN Sucursal s ON hp.id_sucursal = s.id_sucursal
    JOIN DetallePedidos ds ON hp.id_pedido = ds.id_pedido
    JOIN Estado e ON hp.id_estado = e.id_estado
    JOIN Productos pr ON ds.id_producto = pr.id_producto
    ${whereSQL}
    GROUP BY 
      hp.id_historial,
      hp.id_pedido,
      cliente.nombre, cliente.apellido, cliente.telefono,
      s.direccion,
      hp.precio_total,
      hp.fecha_modificacion,
      p.fecha,
      modificador.nombre, modificador.apellido,
      perfil.tipo_perfil,
      hp.id_estado
    ORDER BY hp.fecha_modificacion DESC, hp.id_historial DESC
    LIMIT ? OFFSET ?;
    `,
      [...params, limit, offset]
    );

    const [[{ total }]] = await connectionAdmin.query(
      `SELECT COUNT(*) AS total 
     FROM HistorialPedidos hp
     JOIN Pedidos p ON hp.id_pedido = p.id_pedido
     JOIN Usuarios cliente ON hp.id_usuario = cliente.id_usuario
     JOIN Usuarios modificador ON hp.id_usuario_modificador = modificador.id_usuario
     JOIN Estado e ON hp.id_estado = e.id_estado
     ${whereSQL}`,
      params
    );

    return { historialPedidos, total };
  }

  static async patchPedidoAdmin(id, input, id_usuario_modificador) {
    try {
      await connectionAdmin.query("BEGIN");

      await connectionAdmin.query("SET @id_usuario_modificador = ?", [
        id_usuario_modificador,
      ]);

      await connectionAdmin.query(
        "UPDATE Pedidos SET id_estado = ? WHERE id_pedido = ? ",
        [input.id_estado, id]
      );

      const [pedidoEditado] = await connectionAdmin.query(
        "SELECT * FROM Pedidos WHERE id_estado = ? AND id_pedido = ? LIMIT 1",
        [input.id_estado, id]
      );

      if (pedidoEditado.length === 0) {
        await connectionAdmin.query("ROLLBACK");
        throw new DatabaseError("No se pudo actualizar el pedido");
      }

      await connectionAdmin.query("COMMIT");
      return pedidoEditado[0];
    } catch (error) {
      await connectionAdmin.query("ROLLBACK");
      throw new DatabaseError("Ocurrió un error al editar el pedido");
    }
  }

  static async createPedidoUser({
    id_usuario,
    id_sucursal,
    precio_total,
    productos,
  }) {
    try {
      await connectionUser.query("BEGIN");

      const [pedidoResult] = await connectionUser.query(
        `INSERT INTO Pedidos (id_usuario, id_sucursal, precio_total, id_estado) 
       VALUES (?, ?, ?, ?)`,
        [id_usuario, id_sucursal, precio_total, 1]
      );

      const id_pedido = pedidoResult.insertId;
      for (const p of productos) {
        await connectionUser.query(
          `INSERT INTO DetallePedidos (id_pedido, id_producto, cantidad)
         VALUES (?, ?, ?)`,
          [id_pedido, p.id_producto, p.cantidad]
        );

        await connectionUser.query(
          `UPDATE Productos SET stock = stock - ? WHERE id_producto = ?`,
          [p.cantidad, p.id_producto]
        );
      }

      const [pedidoCreado] = await connectionUser.query(
        "SELECT * FROM Pedidos WHERE id_pedido = ? LIMIT 1",
        [id_pedido]
      );

      if (pedidoCreado.length === 0) {
        await connectionUser.query("ROLLBACK");
        throw new DatabaseError("No se pudo crear el pedido");
      }

      await connectionUser.query("COMMIT");
      return { ...pedidoCreado[0], productos };
    } catch (err) {
      await connectionUser.query("ROLLBACK");
      throw new DatabaseError("Ocurrió un error al crear el pedido");
    }
  }
  static async getPedidosUser({ data }) {
    const [pedidos] = await connectionUser.query(
      `
      SELECT 
        ps.id_pedido,
        DATE_FORMAT(ps.fecha, '%d/%m/%Y %r') AS fecha,
        ps.precio_total,
        ps.id_estado,
        e.detalle_estado AS estado,
        CONCAT(u.nombre, ' ', u.apellido) AS cliente,
        s.direccion AS sucursal,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id_producto', p.id_producto,
            'nombre', p.nombre,
            'slug', p.slug,
            'cantidad', ds.cantidad
          )
        ) AS productos
      FROM Pedidos ps
      JOIN Estado e ON ps.id_estado = e.id_estado
      JOIN Usuarios u ON ps.id_usuario = u.id_usuario
      JOIN DetallePedidos ds ON ps.id_pedido = ds.id_pedido
      JOIN Sucursal s ON ps.id_sucursal = s.id_sucursal
      JOIN Productos p ON ds.id_producto = p.id_producto
      WHERE ps.id_usuario = ?
      GROUP BY 
        ps.id_pedido, 
        ps.fecha, 
        ps.precio_total, 
        ps.id_estado, 
        e.detalle_estado, 
        u.nombre, u.apellido
      ORDER BY ps.fecha DESC, ps.id_pedido ASC;
    `,
      [data.id_usuario]
    );
    return pedidos;
  }

  static async getPedidoByIdUser(id) {
    const [pedidos] = await connectionAdmin.query(
      "SELECT * FROM Pedidos WHERE id_pedido = ? LIMIT 1;",
      [id]
    );
    return pedidos.length > 0;
  }

  static async cancelPedidoUser(id, input, data) {
    try {
      await connectionUser.query("BEGIN");

      await connectionUser.query("SET @id_usuario_modificador = ?", [
        data.id_usuario,
      ]);

      await connectionUser.query(
        "UPDATE Pedidos SET id_estado = ? WHERE id_pedido = ?",
        [5, id]
      );

      const [pedidoEditado] = await connectionUser.query(
        "SELECT * FROM Pedidos WHERE id_pedido = ? LIMIT 1",
        [id]
      );

      if (pedidoEditado.length === 0) {
        await connectionUser.query("ROLLBACK");
        throw new DatabaseError("No se pudo cancelar el pedido");
      }

      await connectionUser.query("COMMIT");
      return pedidoEditado[0];
    } catch (error) {
      await connectionUser.query("ROLLBACK");
      throw new DatabaseError("Ocurrió un error al cancelar el pedido");
    }
  }
}
