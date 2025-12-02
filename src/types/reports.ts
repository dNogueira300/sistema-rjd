// src/types/reports.ts
import type { EquipmentStatus, EquipmentType } from "./equipment";

// ============ MÉTRICAS OPERATIVAS ============

export interface OperationalMetrics {
  totalEquipments: number;
  inRepair: number;
  readyForDelivery: number;
  delivered: number;
  cancelled: number;
}

export interface EquipmentsByStatus {
  status: EquipmentStatus;
  count: number;
  percentage: number;
}

export interface EquipmentsByType {
  type: EquipmentType;
  count: number;
  percentage: number;
}

export interface TechnicianPerformance {
  technicianId: string;
  technicianName: string;
  assignedCount: number;
  completedCount: number;
  averageDays: number;
  revenue: number; // Facturación generada
}

export interface RepairTimeMetrics {
  averageDays: number;
  medianDays: number;
  minDays: number;
  maxDays: number;
  total: number;
}

export interface OverdueEquipment {
  id: string;
  code: string;
  customerName: string;
  technicianName: string | null;
  daysInRepair: number;
  entryDate: Date;
  type: EquipmentType;
  status: EquipmentStatus;
}

// ============ MÉTRICAS FINANCIERAS ============

export interface FinancialKPIs {
  todayIncome: number;
  todayExpenses: number;
  todayProfit: number;
  todayProfitMargin: number; // Porcentaje
  monthIncome: number;
  monthExpenses: number;
  monthProfit: number;
  profitMargin: number; // Porcentaje (del mes)
  pendingPayments: number;
  totalRevenue: number;
}

export interface DailyRevenue {
  date: string; // YYYY-MM-DD
  income: number;
  expenses: number;
  profit: number;
}

export interface PeriodRevenue {
  period: string; // Etiqueta del período
  income: number;
  expenses: number;
  profit: number;
  profitMargin: number; // Porcentaje
  equipmentCount: number;
}

export interface RevenueAnalysis {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  averageTicket: number; // Ingreso promedio por equipo
  equipmentCount: number;
}

export interface TopTechnician {
  technicianId: string;
  technicianName: string;
  completedEquipments: number;
  totalRevenue: number;
  averageRevenue: number;
  averageDays: number;
}

export interface TechnicianExpense {
  technicianId: string;
  technicianName: string;
  totalAdvances: number;
  totalSalaries: number;
  totalExpenses: number;
  advanceCount: number;
  salaryCount: number;
}

export interface TechnicianPaymentDetail {
  id: string;
  date: Date;
  type: "ADVANCE" | "SALARY";
  amount: number;
  technicianName: string;
  technicianId: string;
  paymentMethod: string;
  description: string;
  observations: string | null;
}

export interface TechnicianPaymentsFilters {
  startDate?: string;
  endDate?: string;
  technicianId?: string;
}

export interface TechnicianPaymentsResponse {
  payments: TechnicianPaymentDetail[];
  total: number;
  totalAmount: number;
  totalAdvances: number;
  totalSalaries: number;
  filters: TechnicianPaymentsFilters;
}

// ============ ALERTAS ============

export interface Alert {
  id: string;
  type: "OVERDUE" | "PENDING_PAYMENT" | "HIGH_EXPENSES" | "LOW_REVENUE";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  entityId?: string; // ID del equipo, pago, etc.
  entityCode?: string; // Código del equipo
  createdAt: Date;
}

// ============ FILTROS ============

export interface ReportFilters {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  technicianId?: string;
  equipmentType?: EquipmentType | "ALL";
  status?: EquipmentStatus | "ALL";
}

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

// ============ RESPUESTAS DE API ============

export interface OperationalReportResponse {
  metrics: OperationalMetrics;
  equipmentsByStatus: EquipmentsByStatus[];
  equipmentsByType: EquipmentsByType[];
  technicianPerformance: TechnicianPerformance[];
  repairTimes: RepairTimeMetrics;
  overdueEquipments: OverdueEquipment[];
  filters: ReportFilters;
}

export interface FinancialReportResponse {
  kpis: FinancialKPIs;
  dailyRevenue: DailyRevenue[]; // Últimos 30 días
  periodRevenue: PeriodRevenue[];
  revenueAnalysis: PeriodRevenue[]; // Array de análisis por período
  topTechnicians: TechnicianPerformance[];
  technicianExpenses: TechnicianExpense[];
  alerts: Alert[];
  filters: ReportFilters;
}

// ============ TIPOS PARA PDF ============

export type OperationalReportData = OperationalReportResponse;
export type FinancialReportData = FinancialReportResponse;

// ============ OPCIONES DE PERÍODO ============

export type PeriodType = "daily" | "weekly" | "monthly" | "custom";

export interface PeriodOption {
  type: PeriodType;
  label: string;
  startDate: Date;
  endDate: Date;
}

// ============ EXPORTACIÓN ============

export interface ExportOptions {
  format: "PDF" | "CSV" | "EXCEL";
  reportType: "OPERATIONAL" | "FINANCIAL";
  filters: ReportFilters;
  includeCharts: boolean;
}
