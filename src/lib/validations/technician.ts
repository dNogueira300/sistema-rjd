// src/lib/validations/technician.ts
import { z } from "zod";

// Validación de teléfono peruano (9 dígitos, empieza con 9)
const phoneRegex = /^9\d{8}$/;

// Validación de email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createTechnicianSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),

  email: z
    .string()
    .min(1, "El email es requerido")
    .regex(emailRegex, "Debe ser un email válido")
    .max(100, "El email no puede exceder 100 caracteres")
    .transform((val) => val.toLowerCase().trim()),

  phone: z
    .string()
    .regex(
      phoneRegex,
      "Debe ser un teléfono peruano válido (9 dígitos, empezando con 9)"
    )
    .or(z.literal(""))
    .transform((val) => val?.replace(/\s/g, "") || "")
    .optional(),
});

export const updateTechnicianSchema = createTechnicianSchema
  .extend({
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Al menos un campo debe ser actualizado",
  });

export const technicianFiltersSchema = z.object({
  search: z.string().default(""),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).default("ALL"),
  sortBy: z.enum(["name", "createdAt", "email"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Tipos derivados de los esquemas
export type CreateTechnicianInput = z.infer<typeof createTechnicianSchema>;
export type UpdateTechnicianInput = z.infer<typeof updateTechnicianSchema>;
export type TechnicianFiltersInput = z.infer<typeof technicianFiltersSchema>;

// Helper para formatear teléfono
export const formatPhone = (phone: string): string => {
  if (!phone) return "";
  return phone.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
};

// Validar teléfono manualmente
export const validatePhone = (phone: string): boolean => {
  if (!phone) return true; // Campo opcional
  return phoneRegex.test(phone.replace(/\D/g, ""));
};

// Validar email manualmente
export const validateEmail = (email: string): boolean => {
  return emailRegex.test(email);
};
