// src/lib/validations/license.ts
import { z } from "zod";
import type { PackageStockStatus } from "@/types/license";

export const LICENSE_LOW_STOCK_THRESHOLD = 2;

export const getStockStatus = (remaining: number): PackageStockStatus => {
  if (remaining <= 0) return "DEPLETED";
  if (remaining <= LICENSE_LOW_STOCK_THRESHOLD) return "LOW";
  return "ACTIVE";
};

// ====== PAQUETE ======
export const createLicensePackageSchema = z.object({
  provider: z
    .string()
    .max(100, "El proveedor no puede exceder 100 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
  totalLicenses: z
    .number()
    .int("El total debe ser un número entero")
    .min(1, "El total debe ser al menos 1")
    .max(100000, "El total es demasiado grande"),
  purchaseDate: z
    .string()
    .min(1, "La fecha de compra es requerida")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha inválida"),
  observations: z
    .string()
    .max(500, "Las observaciones no pueden exceder 500 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
});

export const updateLicensePackageSchema = createLicensePackageSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Al menos un campo debe ser actualizado",
  });

// ====== ACTIVACIÓN ======
export const createLicenseActivationSchema = z.object({
  packageId: z.string().min(1, "El paquete es requerido"),
  activationDate: z
    .string()
    .min(1, "La fecha es requerida")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha inválida"),
  technicianId: z.string().min(1, "El técnico es requerido"),
  licenseKey: z
    .string()
    .min(1, "La clave es requerida")
    .max(200, "La clave no puede exceder 200 caracteres")
    .trim(),
  support: z
    .string()
    .min(1, "El soporte es requerido")
    .max(1000, "El soporte no puede exceder 1000 caracteres")
    .trim(),
  customerId: z.string().min(1, "El cliente es requerido"),
  observations: z
    .string()
    .max(500, "Las observaciones no pueden exceder 500 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
});

export const updateLicenseActivationSchema = createLicenseActivationSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Al menos un campo debe ser actualizado",
  });

export const licenseActivationFiltersSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  technicianId: z.string().optional(),
  customerId: z.string().optional(),
  packageId: z.string().optional(),
});

export type CreateLicensePackageInput = z.infer<
  typeof createLicensePackageSchema
>;
export type CreateLicenseActivationInput = z.infer<
  typeof createLicenseActivationSchema
>;
