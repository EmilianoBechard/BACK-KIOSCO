import { validPedido, validEditPedido } from "../schemas/validPedidos.js";
import {
  ConflictError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";
import { PedidosModel } from "../models/PedidosModel.js";
import { getProductosPorIds } from "../utils/checkProducts.js";
import { sendWhatsAppTemplate } from "../utils/twilio.js";
import { getUserById } from "../utils/checkUser.js";
import { normalizeTelefonoWhatsApp } from "../utils/utils.js";

export class PedidosController {
  static async getDetallesPedidosAdmin(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { id_pedido, cliente, fecha, detalle_estado } = req.query;

    try {
      const { detallePedidos, total } =
        await PedidosModel.getPedidoConDetallesAdmin(page, limit, offset, {
          id_pedido,
          cliente,
          fecha: fecha ? fecha.replace("T", " ") : null,
          detalle_estado,
        });
      return res.status(200).json({
        detallePedidos,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (e) {
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }
  static async getHistorialPedidosAdmin(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const {
      id_pedido,
      cliente,
      fecha_pedido_desde,
      fecha_pedido_hasta,
      detalle_estado,
      fecha_modificacion_desde,
      fecha_modificacion_hasta,
      usuario_modificador,
    } = req.query;

    try {
      const { historialPedidos, total } =
        await PedidosModel.getHistorialPedidosAdmin(page, limit, offset, {
          id_pedido,
          cliente,
          fecha_pedido_desde: fecha_pedido_desde
            ? fecha_pedido_desde.replace("T", " ")
            : null,
          fecha_pedido_hasta: fecha_pedido_hasta
            ? fecha_pedido_hasta.replace("T", " ")
            : null,
          detalle_estado,
          fecha_modificacion_desde: fecha_modificacion_desde
            ? fecha_modificacion_desde.replace("T", " ")
            : null,
          fecha_modificacion_hasta: fecha_modificacion_hasta
            ? fecha_modificacion_hasta.replace("T", " ")
            : null,
          usuario_modificador,
        });

      return res.status(200).json({
        historialPedidos,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (e) {
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  static async patchPedidoAdmin(req, res) {
    try {
      const { id } = req.params;
      const result = validEditPedido(req.body);
      if (!result.success) {
        const firstErrorMessage =
          result.error?.issues?.[0].message || "Error de validación";
        return res.status(400).json({ error: firstErrorMessage });
      }
      const input = result.data;
      const pedido = await PedidosModel.getPedidoByIdAdmin(id);
      if (!pedido) throw new NotFoundError("Pedido no encontrado");

      const id_usuario_modificador = req.user.id_usuario;

      const updated = await PedidosModel.patchPedidoAdmin(
        id,
        input,
        id_usuario_modificador
      );
      const usuario = await getUserById(updated);

      const telefonoNormalized = normalizeTelefonoWhatsApp(usuario.telefono);

      //   await sendWhatsAppTemplate(
      //     telefonoNormalized,
      //     `Hola ${usuario.nombre} ${usuario.apellido}, el estado de tu pedido #${updated.id_pedido} fue actualizado. Entra a http://192.168.100.216:5173/ e inicia sesión para visualizar el cambio`
      //   );
      return res.json({
        message: "Pedido actualizado correctamente",
      });
    } catch (e) {
      if (e instanceof ValidationError)
        return res.status(400).json({ error: e.message });
      if (e instanceof NotFoundError)
        return res.status(404).json({ error: e.message });
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }
  static async createPedidoUser(req, res) {
    const result = validPedido(req.body);
    if (!result.success) {
      const firstErrorMessage =
        result.error?.issues?.[0].message || "Error de validación";
      return res.status(400).json({ error: firstErrorMessage });
    }
    const data = req.user;
    const input = result.data;

    const productosIds = input.productos.map((p) => p.id_producto);
    const productosDB = await getProductosPorIds(productosIds);

    let totalCalculado = 0;
    const productosValidos = [];
    try {
      for (const p of input.productos) {
        const productoReal = productosDB.find(
          (dbP) => dbP.id_producto === p.id_producto
        );

        if (!productoReal)
          throw new NotFoundError(`Producto ${p.nombre} no existe`);

        if (!productoReal.activo)
          throw new ConflictError(
            `Producto ${productoReal.nombre} no está activo`
          );

        if (p.cantidad > productoReal.stock)
          throw new ValidationError(
            `Stock insuficiente para ${productoReal.nombre}`
          );

        const precioUnitario = productoReal.precio;
        totalCalculado += precioUnitario * p.cantidad;

        productosValidos.push({
          id_producto: p.id_producto,
          cantidad: p.cantidad,
        });
      }

      const createdPedido = await PedidosModel.createPedidoUser({
        id_usuario: data.id_usuario,
        id_sucursal: input.id_sucursal,
        precio_total: totalCalculado,
        productos: productosValidos,
      });

      if (!createdPedido) throw new DatabaseError("No se pudo crear el pedido");

      const usuario = await getUserById(data);

      const telefonoNormalized = normalizeTelefonoWhatsApp(usuario.telefono);

      //   await sendWhatsAppTemplate(
      //     telefonoNormalized,
      //     `Hola ${usuario.nombre} ${usuario.apellido}, tu pedido #${createdPedido.id_pedido} fue creado con éxito. Total: $${createdPedido.precio_total}`
      //   );

      return res.json({ message: "Pedido creado", pedido: createdPedido });
    } catch (e) {
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

  static async cancelPedidoUser(req, res) {
    const { id } = req.params;
    const result = validEditPedido(req.body);
    if (!result.success) {
      const firstErrorMessage =
        result.error?.issues?.[0].message || "Error de validación";
      return res.status(400).json({ error: firstErrorMessage });
    }
    const input = result.data;
    if (input.id_estado !== 5)
      throw new ValidationError("No se puede modificar el estado");

    const pedido = await PedidosModel.getPedidoByIdUser(id);
    if (!pedido) throw new NotFoundError("Pedido no encontrado");
    const data = req.user;
    try {
      const updated = await PedidosModel.cancelPedidoUser(id, input, data);
      return res.json({
        message: "Pedido cancelado correctamente",
      });
    } catch (e) {
      if (e instanceof ValidationError)
        return res.status(400).json({ error: e.message });
      if (e instanceof NotFoundError)
        return res.status(404).json({ error: e.message });
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }
  static async getPedidosUser(req, res) {
    try {
      const data = req.user;
      const pedidosUser = await PedidosModel.getPedidosUser({ data });
      return res.status(200).json({ pedidosUser: pedidosUser || [] });
    } catch (e) {
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }
}
