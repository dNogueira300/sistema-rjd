// src/types/finance.ts

import type { PaymentMethod, PaymentStatus, VoucherType } from "./equipment";

// Tipos de egreso
export type ExpenseType =
  | "ADVANCE"        // Adelanto a trabajador
  | "SALARY"         // Pago de salario
  | "SUPPLIES"       // Materiales/insumos
  | "RENT"           // Alquiler
  | "SERVICES"       // Servicios (luz, agua, internet)
  | "MAINTENANCE"    // Mantenimiento
  | "OTHER";         // Otros gastos

// Tipo de transacción
export type TransactionType = "INGRESO" | "EGRESO";

// Interfaz para Expenses (Egresos)
export interface Expense {
  id: string;
  expenseType: ExpenseType;
  description: string;
  amount: number;
  beneficiary: string | null;
  paymentMethod: PaymentMethod;
  expenseDate: Date;
  observations: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  createdByUser?: {
    id: string;
    name: string;
  };
}

// Interfaz para Payment (ya existe en equipment.ts pero la extendemos aquí)
export interface PaymentTransaction {
  id: string;
  equipmentId: string;
  totalAmount: number;
  advanceAmount: number;
  remainingAmount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  voucherType: VoucherType;
  paymentStatus: PaymentStatus;
  observations: string | null;
  equipment?: {
    id: string;
    code: string;
    customer: {
      id: string;
      name: string;
    };
  };
}

// Transacción consolidada para la tabla
export interface ConsolidatedTransaction {
  id: string;
  date: Date;
  type: TransactionType;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  category: string; // paymentStatus para INGRESO, expenseType para EGRESO
  observations: string | null;
  beneficiary?: string; // Receptor del pago/gasto
  // Campos específicos según tipo
  equipmentCode?: string;
  equipmentServiceType?: string | null;
  voucherType?: VoucherType;
  paymentStatus?: PaymentStatus;
  expenseType?: ExpenseType;
}

// Datos para crear un ingreso (Payment)
export interface CreatePaymentData {
  equipmentId: string;
  totalAmount: number;
  advanceAmount: number;
  paymentMethod: PaymentMethod;
  voucherType: VoucherType;
  paymentStatus: PaymentStatus;
  observations?: string;
}

// Datos para crear un egreso (Expense)
export interface CreateExpenseData {
  expenseType: ExpenseType;
  description: string;
  amount: number;
  beneficiary?: string;
  paymentMethod: PaymentMethod;
  expenseDate?: Date;
  observations?: string;
}

// Datos para actualizar un egreso
export interface UpdateExpenseData extends Partial<CreateExpenseData> {
  id: string;
}

// Filtros para transacciones
export interface TransactionFilters {
  type: "ALL" | TransactionType;
  startDate?: Date;
  endDate?: Date;
  search: string;
  paymentMethod: "ALL" | PaymentMethod;
  technicianId?: string; // Filtro por técnico asignado
  sortBy: "date" | "amount" | "type";
  sortOrder: "asc" | "desc";
}

// Métricas del dashboard
export interface FinanceMetrics {
  todayIncome: number;
  todayExpenses: number;
  balance: number;
  monthlyProfitability: number;
  pendingPayments: number;
  pendingAdvances: number;
}

// Métricas del periodo filtrado
export interface PeriodMetrics {
  income: number;      // Total de ingresos del periodo
  expenses: number;    // Total de egresos del periodo
  difference: number;  // Diferencia (ingresos - egresos)
}

// Respuesta de la API
export interface TransactionsResponse {
  transactions: ConsolidatedTransaction[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  periodMetrics?: PeriodMetrics; // Métricas del periodo filtrado (si hay filtros de fecha)
}

// Labels para tipos de egreso
export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  ADVANCE: "Adelanto",
  SALARY: "Salario",
  SUPPLIES: "Materiales/Insumos",
  RENT: "Alquiler",
  SERVICES: "Servicios",
  MAINTENANCE: "Mantenimiento",
  OTHER: "Otros",
};

// Labels para tipos de transacción
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  INGRESO: "Ingreso",
  EGRESO: "Egreso",
};

// Colores para tipos de transacción
export const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
  INGRESO: "bg-green-600/20 text-green-400 border-green-600/30",
  EGRESO: "bg-red-600/20 text-red-400 border-red-600/30",
};
