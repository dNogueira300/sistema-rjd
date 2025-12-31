// src/lib/validations/client.ts
import { z } from "zod";

// Validación de RUC peruano (11 dígitos, empieza con 10, 15, 16, 17 o 20)
const rucRegex = /^(10|15|16|17|20)\d{9}$/;

// Validación de teléfono peruano (9 dígitos, empieza con 9)
const phoneRegex = /^9\d{8}$/;

export const createClientSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),

  phone: z
    .string()
    .min(1, "El teléfono es requerido")
    .regex(
      phoneRegex,
      "Debe ser un teléfono peruano válido (9 dígitos, empezando con 9)"
    )
    .transform((val) => val.replace(/\s/g, "")), // Remove spaces

  ruc: z
    .string()
    .regex(rucRegex, "Debe ser un RUC peruano válido (11 dígitos)")
    .optional()
    .or(z.literal("")),
});

export const updateClientSchema = createClientSchema
  .extend({
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Al menos un campo debe ser actualizado",
  });

export const clientFiltersSchema = z.object({
  search: z.string().default(""),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).default("ALL"),
  sortBy: z.enum(["name", "createdAt", "lastVisit"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Tipos derivados de los esquemas
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientFiltersInput = z.infer<typeof clientFiltersSchema>;

// Helper para formatear RUC
// export const formatRUC = (ruc: string): string => {
//   return ruc.replace(/(\d{2})(\d{9})/, "$1-$2");
// };
export const formatRUC = (ruc: string): string => {
  // Quitar todo lo que no sea dígito y devolver los dígitos concatenados (sin guion)
  return ruc.replace(/\D/g, "");
};

// Helper para formatear teléfono
export const formatPhone = (phone: string): string => {
  return phone.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
};

// Validar RUC manualmente (para uso en formularios)
export const validateRUC = (ruc: string): boolean => {
  if (!ruc) return true; // Optional field
  return rucRegex.test(ruc.replace(/\D/g, ""));
};

// Validar teléfono manualmente
export const validatePhone = (phone: string): boolean => {
  return phoneRegex.test(phone.replace(/\D/g, ""));
};
