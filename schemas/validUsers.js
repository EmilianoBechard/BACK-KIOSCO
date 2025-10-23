import { z } from "zod";

export const schemaUser = z.object({
  nombre: z
    .string()
    .min(1, "El campo 'Nombre' debe tener minimo 1 caracter")
    .max(100, "El campo 'Nombre' debe tener maximo 100 caracteres"),
  apellido: z
    .string()
    .min(1, "El campo 'Apellido' debe tener minimo 1 caracter")
    .max(100, "El campo 'Apellido' debe tener maximo 100 caracteres"),
  telefono: z
    .string()
    .min(10, "El campo 'Telefono' debe tener minimo 10 caracteres")
    .max(15, "El campo 'Telefono' debe tener maximo 15 caracterres")
    .regex(/^(0?\d{2})?\d{8}$/, "Teléfono inválido"),
  email: z
    .email("El email no es válido")
    .max(150, "El correo debe tener maximo 150 caracteres"),
  contraseña: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(255, "La contraseña debe tener maximo 255 caracteres"),
});

export const schemaUserEdit = z.object({
  nombre: z
    .string()
    .min(1, "El campo 'Nombre' debe tener minimo 1 caracter")
    .max(100, "El campo 'Nombre' debe tener maximo 100 caracteres")
    .optional(),
  apellido: z
    .string()
    .min(1, "El campo 'Apellido' debe tener minimo 1 caracter")
    .max(100, "El campo 'Apellido' debe tener maximo 100 caracteres")
    .optional(),
  telefono: z
    .string()
    .min(10, "El campo 'Telefono' debe tener minimo 10 caracteres")
    .max(15, "El campo 'Telefono' debe tener maximo 15 caracterres")
    .regex(/^(0?\d{2})?\d{8}$/, "Teléfono inválido")
    .optional(),
  email: z
    .email("El email no es válido")
    .max(150, "El correo debe tener maximo 150 caracteres")
    .optional(),
  contraseñaNueva: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(255, "La contraseña debe tener maximo 255 caracteres")
    .optional(),
  contraseñaActual: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(255, "La contraseña debe tener maximo 255 caracteres")
    .optional(),
});

export const schemaUserLogin = z.object({
  email: z
    .email("El email no es válido")
    .max(150, "El correo debe tener maximo 150 caracteres"),
  contraseña: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(255, "La contraseña debe tener maximo 255 caracteres"),
});

export function validUsersLogin(object) {
  return schemaUserLogin.safeParse(object);
}

export function validUsers(object) {
  return schemaUser.safeParse(object);
}

export function validPartialUsers(object) {
  return schemaUserEdit.partial().safeParse(object);
}
