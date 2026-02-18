// src/lib/validations/equipment.ts
import { z } from "zod";

// Enums de validación
const equipmentTypeEnum = z.enum(["PC", "LAPTOP", "PRINTER", "PLOTTER", "OTHER"]);
const equipmentStatusEnum = z.enum(["RECEIVED", "REPAIR", "REPAIRED", "DELIVERED", "CANCELLED"]);

export const createEquipmentSchema = z.object({
  customerId: z
    .string()
    .min(1, "El cliente es requerido")
    .cuid("ID de cliente inválido"),

  type: equipmentTypeEnum.refine((val) => val !== undefined, {
    message: "El tipo de equipo es requerido",
  }),

  brand: z
    .string()
    .max(50, "La marca no puede exceder 50 caracteres")
    .optional()
    .or(z.literal("")),

  model: z
    .string()
    .max(50, "El modelo no puede exceder 50 caracteres")
    .optional()
    .or(z.literal("")),

  serialNumber: z
    .string()
    .max(100, "El número de serie no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),

  reportedFlaw: z
    .string()
    .min(1, "La falla reportada es requerida")
    .min(5, "La descripción de la falla debe tener al menos 5 caracteres")
    .max(500, "La descripción de la falla no puede exceder 500 caracteres")
    .trim(),

  accessories: z
    .string()
    .max(300, "Los accesorios no pueden exceder 300 caracteres")
    .optional()
    .or(z.literal("")),

  serviceType: z
    .string()
    .max(100, "El tipo de servicio no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),

  others: z
    .string()
    .max(500, "La información adicional no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
});

export const updateEquipmentSchema = createEquipmentSchema
  .extend({
    status: equipmentStatusEnum.optional(),
    assignedTechnicianId: z.string().cuid("ID de técnico inválido").optional().nullable(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Al menos un campo debe ser actualizado",
  });

export const changeStatusSchema = z.object({
  equipmentId: z
    .string()
    .min(1, "El ID del equipo es requerido")
    .cuid("ID de equipo inválido"),

  newStatus: equipmentStatusEnum,

  observations: z
    .string()
    .max(500, "Las observaciones no pueden exceder 500 caracteres")
    .optional()
    .or(z.literal("")),

  assignedTechnicianId: z
    .string()
    .cuid("ID de técnico inválido")
    .optional()
    .nullable(),
});

export const equipmentFiltersSchema = z.object({
  search: z.string().default(""),
  status: z.enum(["ALL", "RECEIVED", "REPAIR", "REPAIRED", "DELIVERED", "CANCELLED"]).default("ALL"),
  type: z.enum(["ALL", "PC", "LAPTOP", "PRINTER", "PLOTTER", "OTHER"]).default("ALL"),
  sortBy: z.enum(["code", "entryDate", "status", "type"]).default("entryDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Tipos derivados de los esquemas
export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
export type EquipmentFiltersInput = z.infer<typeof equipmentFiltersSchema>;

// Función para generar código único: RJD-YYYYMMDD-NNNN
export const generateEquipmentCode = async (
  getLastCodeOfDay: () => Promise<string | null>
): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const datePrefix = `RJD-${year}${month}${day}`;

  const lastCode = await getLastCodeOfDay();

  if (!lastCode) {
    return `${datePrefix}-0001`;
  }

  // Extraer el número secuencial del último código
  const parts = lastCode.split("-");
  if (parts.length === 3 && parts[0] === "RJD") {
    const lastNumber = parseInt(parts[2], 10);
    const nextNumber = String(lastNumber + 1).padStart(4, "0");
    return `${datePrefix}-${nextNumber}`;
  }

  return `${datePrefix}-0001`;
};

// Validar transición de estado
export const isValidStatusTransition = (
  currentStatus: string,
  newStatus: string,
  userRole: "ADMINISTRADOR" | "TECNICO"
): { valid: boolean; message?: string } => {
  // Administrador puede cambiar a cualquier estado diferente al actual
  if (userRole === "ADMINISTRADOR") {
    if (currentStatus === newStatus) {
      return {
        valid: false,
        message: `El equipo ya se encuentra en estado ${currentStatus}`,
      };
    }
    return { valid: true };
  }

  // Técnico solo puede cambiar a REPAIRED
  if (userRole === "TECNICO") {
    if (newStatus !== "REPAIRED") {
      return {
        valid: false,
        message: "Los técnicos solo pueden marcar equipos como reparados",
      };
    }
    if (currentStatus !== "REPAIR") {
      return {
        valid: false,
        message: "Solo se pueden marcar como reparados equipos en reparación",
      };
    }
    return { valid: true };
  }

  return { valid: false, message: "Rol no autorizado" };
};
