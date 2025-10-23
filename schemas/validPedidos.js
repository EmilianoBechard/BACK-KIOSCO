import { z } from "zod";

export const pedidoSchema = z.object({
  id_sucursal: z.number().int().positive(),
  productos: z
    .array(
      z.object({
        id_producto: z.number().int().positive(),
        cantidad: z.number().int().positive(),
      })
    )
    .min(1, "Debe haber al menos un producto"),
  precio_total: z.number().positive(), // se recalcula en backend
});

export const editPedidoSchema = z.object({
  id_estado: z.number().int().positive(),
});

export function validEditPedido(object) {
  return editPedidoSchema.safeParse(object);
}

export function validPedido(object) {
  return pedidoSchema.safeParse(object);
}
