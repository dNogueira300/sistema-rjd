// src/lib/validations/user.ts
import { z } from "zod";

// Teléfono peruano: 9 dígitos empezando con 9
const phoneRegex = /^9\d{8}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Misma política que el cambio de contraseña
export const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
export const PASSWORD_RULE_MESSAGE =
  "Mínimo 8 caracteres con mayúscula, minúscula, número y un carácter especial (@$!%*?&#)";

export const roleSchema = z.enum(["ADMINISTRADOR", "TECNICO"]);
export const userStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

const nameField = z
  .string()
  .trim()
  .min(3, "El nombre debe tener al menos 3 caracteres")
  .max(100, "El nombre no puede exceder 100 caracteres");

const emailField = z
  .string()
  .trim()
  .min(1, "El email es requerido")
  .max(100, "El email no puede exceder 100 caracteres")
  .regex(emailRegex, "Debe ser un email válido")
  .transform((val) => val.toLowerCase());

const phoneField = z
  .string()
  .transform((val) => val.replace(/\s/g, ""))
  .refine((val) => val === "" || phoneRegex.test(val), {
    message: "Debe ser un teléfono peruano válido (9 dígitos, empezando con 9)",
  })
  .optional();

const passwordField = z
  .string()
  .regex(strongPasswordRegex, PASSWORD_RULE_MESSAGE);

export const createUserSchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  role: roleSchema,
  password: passwordField,
});

export const updateUserSchema = z
  .object({
    name: nameField.optional(),
    email: emailField.optional(),
    phone: phoneField,
    role: roleSchema.optional(),
    status: userStatusSchema.optional(),
    // Opcional: solo si el administrador quiere restablecerla
    password: passwordField.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Al menos un campo debe ser actualizado",
  });

export const userFiltersSchema = z.object({
  search: z.string().default(""),
  role: z.enum(["ALL", "ADMINISTRADOR", "TECNICO"]).default("ALL"),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).default("ALL"),
  sortBy: z.enum(["name", "email", "createdAt", "role"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
