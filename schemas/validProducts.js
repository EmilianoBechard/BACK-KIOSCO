import { z } from "zod";

export const schemaProduct = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(50, "El nombre debe tener maximo 50 caracteres"),
  descripcion: z
    .string()
    .max(300, "La descripcion no puede superar los 300 caracteres")
    .optional(),
  id_categoria: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "Debe seleccionar una categoria")
  ),
  stock: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "El stock no puede ser menor a 0")
  ),
  precio: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "El precio debe ser mayor a 0")
  ),
  destacado: z.boolean(),
  carousel: z.boolean(),
  activo: z.boolean(),
});

export const schemaCategoria = z.object({
  categoria: z
    .string()
    .min(5, "La categoria debe tener minimo 5 caracteres")
    .max(20, "La categoria debe tener maximo 20 caracteres"),
});

export const schemaEditProduct = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(50, "El nombre debe tener maximo 50 caracteres"),
  descripcion: z
    .string()
    .max(300, "La descripcion no puede superar los 300 caracteres")
    .optional(),
  id_categoria: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "Debe seleccionar una categoria")
  ),
  stock: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "El stock no puede ser menor a 0")
  ),
  restarStock: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "El stock no puede ser menor a 0")
  ),
  sumarStock: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "El stock no puede ser menor a 0")
  ),
  precio: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "El precio debe ser mayor a 0")
  ),
  destacado: z.boolean(),
  carousel: z.boolean(),
  activo: z.boolean(),
});

export function validPartialProductEdit(object) {
  return schemaEditProduct.partial().safeParse(object);
}

export function validProducts(object) {
  return schemaProduct.safeParse(object);
}
export function validCategories(object) {
  return schemaCategoria.safeParse(object);
}

export function validPartialProduct(object) {
  return schemaProduct.partial().safeParse(object);
}
