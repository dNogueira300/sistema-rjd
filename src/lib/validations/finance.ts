// src/lib/validations/finance.ts
import { z } from "zod";

// Schema para método de pago
const paymentMethodSchema = z.enum(["CASH", "YAPE", "PLIN", "TRANSFER"]);

// Schema para tipo de comprobante
const voucherTypeSchema = z.enum(["RECEIPT", "INVOICE", "DELIVERY_NOTE"]);

// Schema para estado de pago
const paymentStatusSchema = z.enum(["PENDING", "PARTIAL", "COMPLETED"]);

// Schema para tipo de egreso
const expenseTypeSchema = z.enum([
  "ADVANCE",
  "SALARY",
  "SUPPLIES",
  "RENT",
  "SERVICES",
  "FOOD",
  "FUEL",
  "MAINTENANCE",
  "OTHER",
]);

// Schema para crear un pago (Ingreso)
export const createPaymentSchema = z.object({
  equipmentId: z.string().min(1, "Debe seleccionar un equipo"),
  totalAmount: z.number().min(0, "El monto total debe ser mayor o igual a 0"),
  advanceAmount: z.number().min(0, "El adelanto debe ser mayor o igual a 0"),
  paymentMethod: paymentMethodSchema,
  voucherType: voucherTypeSchema,
  paymentStatus: paymentStatusSchema,
  observations: z.string().optional(),
}).refine(
  (data) => data.advanceAmount <= data.totalAmount,
  {
    message: "El adelanto no puede ser mayor al monto total",
    path: ["advanceAmount"],
  }
);

// Schema para crear un egreso (Expense)
export const createExpenseSchema = z.object({
  expenseType: expenseTypeSchema,
  description: z.string().min(1, "La descripción es obligatoria"),
  amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
  beneficiary: z.string().optional(),
  paymentMethod: paymentMethodSchema,
  expenseDate: z.string().or(z.date()).optional(),
  observations: z.string().optional(),
});

// Schema para actualizar un egreso
export const updateExpenseSchema = createExpenseSchema.partial().extend({
  id: z.string().min(1, "ID del egreso es requerido"),
});

// Schema para filtros de transacciones
export const transactionFiltersSchema = z.object({
  type: z.enum(["ALL", "INGRESO", "EGRESO"]).optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  search: z.string().optional(),
  paymentMethod: z.enum(["ALL", "CASH", "YAPE", "PLIN", "TRANSFER"]).optional(),
  technicianId: z.string().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sortBy: z.enum(["date", "amount", "type"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type TransactionFiltersInput = z.infer<typeof transactionFiltersSchema>;
