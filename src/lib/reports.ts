// src/lib/reports.ts
import type {
  OperationalMetrics,
  EquipmentsByStatus,
  EquipmentsByType,
  RepairTimeMetrics,
  FinancialKPIs,
  DailyRevenue,
  RevenueAnalysis,
  Alert,
} from "@/types/reports";
import type { EquipmentStatus, EquipmentType } from "@/types/equipment";

// ============ UTILIDADES DE FECHA ============

export function getDateRange(
  type: "today" | "week" | "month" | "custom",
  customStart?: Date,
  customEnd?: Date
): { startDate: Date; endDate: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (type) {
    case "today":
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };

    case "week":
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 7);
      return { startDate: weekStart, endDate: now };

    case "month":
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: monthStart, endDate: now };

    case "custom":
      if (!customStart || !customEnd) {
        throw new Error("Custom dates required");
      }
      return { startDate: customStart, endDate: customEnd };

    default:
      return { startDate: today, endDate: now };
  }
}

export function getDaysBetween(startDate: Date, endDate: Date): number {
  const diff = endDate.getTime() - startDate.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDateForSQL(date: Date): string {
  return date.toISOString();
}

export function getLast30Days(): Date[] {
  const dates: Date[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    date.setHours(0, 0, 0, 0);
    dates.push(date);
  }

  return dates;
}

// ============ CÁLCULOS DE MÉTRICAS OPERATIVAS ============

export function calculateOperationalMetrics(
  equipments: Array<{
    status: EquipmentStatus;
  }>
): OperationalMetrics {
  const statusCounts = equipments.reduce(
    (acc, eq) => {
      acc[eq.status] = (acc[eq.status] || 0) + 1;
      return acc;
    },
    {} as Record<EquipmentStatus, number>
  );

  return {
    totalEquipments: equipments.length,
    inRepair: (statusCounts.REPAIR || 0) + (statusCounts.RECEIVED || 0),
    readyForDelivery: statusCounts.REPAIRED || 0,
    delivered: statusCounts.DELIVERED || 0,
    cancelled: statusCounts.CANCELLED || 0,
  };
}

export function calculateEquipmentsByStatus(
  equipments: Array<{ status: EquipmentStatus }>
): EquipmentsByStatus[] {
  const total = equipments.length;
  if (total === 0) return [];

  const statusCounts = equipments.reduce(
    (acc, eq) => {
      acc[eq.status] = (acc[eq.status] || 0) + 1;
      return acc;
    },
    {} as Record<EquipmentStatus, number>
  );

  return Object.entries(statusCounts).map(([status, count]) => ({
    status: status as EquipmentStatus,
    count,
    percentage: (count / total) * 100,
  }));
}

export function calculateEquipmentsByType(
  equipments: Array<{ type: EquipmentType }>
): EquipmentsByType[] {
  const total = equipments.length;
  if (total === 0) return [];

  const typeCounts = equipments.reduce(
    (acc, eq) => {
      acc[eq.type] = (acc[eq.type] || 0) + 1;
      return acc;
    },
    {} as Record<EquipmentType, number>
  );

  return Object.entries(typeCounts).map(([type, count]) => ({
    type: type as EquipmentType,
    count,
    percentage: (count / total) * 100,
  }));
}

export function calculateRepairTimes(
  equipments: Array<{
    entryDate: Date;
    deliveryDate: Date | null;
  }>
): RepairTimeMetrics {
  const deliveredEquipments = equipments.filter((eq) => eq.deliveryDate);

  if (deliveredEquipments.length === 0) {
    return {
      averageDays: 0,
      medianDays: 0,
      minDays: 0,
      maxDays: 0,
      total: 0,
    };
  }

  const days = deliveredEquipments.map((eq) =>
    getDaysBetween(eq.entryDate, eq.deliveryDate!)
  );

  days.sort((a, b) => a - b);

  const sum = days.reduce((acc, d) => acc + d, 0);
  const avg = sum / days.length;
  const median =
    days.length % 2 === 0
      ? (days[days.length / 2 - 1] + days[days.length / 2]) / 2
      : days[Math.floor(days.length / 2)];

  return {
    averageDays: Math.round(avg * 10) / 10,
    medianDays: Math.round(median * 10) / 10,
    minDays: days[0],
    maxDays: days[days.length - 1],
    total: deliveredEquipments.length,
  };
}

// ============ CÁLCULOS FINANCIEROS ============

export function calculateFinancialKPIs(data: {
  todayIncome: number;
  todayExpenses: number;
  monthIncome: number;
  monthExpenses: number;
  pendingPayments: number;
  totalRevenue: number;
}): FinancialKPIs {
  const todayProfit = data.todayIncome - data.todayExpenses;
  const todayProfitMargin =
    data.todayIncome > 0 ? (todayProfit / data.todayIncome) * 100 : 0;

  const monthProfit = data.monthIncome - data.monthExpenses;
  const monthProfitMargin =
    data.monthIncome > 0 ? (monthProfit / data.monthIncome) * 100 : 0;

  return {
    todayIncome: data.todayIncome,
    todayExpenses: data.todayExpenses,
    todayProfit,
    todayProfitMargin: Math.round(todayProfitMargin * 100) / 100,
    monthIncome: data.monthIncome,
    monthExpenses: data.monthExpenses,
    monthProfit,
    profitMargin: Math.round(monthProfitMargin * 100) / 100,
    pendingPayments: data.pendingPayments,
    totalRevenue: data.totalRevenue,
  };
}

export function calculateDailyRevenue(
  payments: Array<{ paymentDate: Date; advanceAmount: number; totalAmount: number }>,
  expenses: Array<{ expenseDate: Date; amount: number }>
): DailyRevenue[] {
  const last30Days = getLast30Days();
  const dailyData: Map<string, DailyRevenue> = new Map();

  // Inicializar todos los días
  last30Days.forEach((date) => {
    const dateStr = date.toISOString().split("T")[0];
    dailyData.set(dateStr, {
      date: dateStr,
      income: 0,
      expenses: 0,
      profit: 0,
    });
  });

  // Agregar ingresos
  payments.forEach((payment) => {
    const dateStr = new Date(payment.paymentDate).toISOString().split("T")[0];
    const existing = dailyData.get(dateStr);
    if (existing) {
      // Usar advanceAmount si es menor que totalAmount (pago parcial)
      const amount = payment.advanceAmount < payment.totalAmount
        ? payment.advanceAmount
        : payment.totalAmount;
      existing.income += amount;
    }
  });

  // Agregar gastos
  expenses.forEach((expense) => {
    const dateStr = new Date(expense.expenseDate).toISOString().split("T")[0];
    const existing = dailyData.get(dateStr);
    if (existing) {
      existing.expenses += expense.amount;
    }
  });

  // Calcular profit
  dailyData.forEach((data) => {
    data.profit = data.income - data.expenses;
  });

  return Array.from(dailyData.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

export function calculateRevenueAnalysis(
  totalIncome: number,
  totalExpenses: number,
  equipmentCount: number
): RevenueAnalysis {
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
  const averageTicket = equipmentCount > 0 ? totalIncome / equipmentCount : 0;

  return {
    totalIncome,
    totalExpenses,
    netProfit,
    profitMargin: Math.round(profitMargin * 100) / 100,
    averageTicket: Math.round(averageTicket * 100) / 100,
    equipmentCount,
  };
}

// ============ GENERACIÓN DE ALERTAS ============

export function generateAlerts(data: {
  overdueEquipments: Array<{ id: string; code: string; daysInRepair: number }>;
  pendingPayments: number;
  monthExpenses: number;
  monthIncome: number;
}): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  // Alertas de equipos vencidos
  data.overdueEquipments.forEach((eq) => {
    let severity: Alert["severity"] = "MEDIUM";
    if (eq.daysInRepair > 30) severity = "CRITICAL";
    else if (eq.daysInRepair > 21) severity = "HIGH";

    alerts.push({
      id: `overdue-${eq.id}`,
      type: "OVERDUE",
      severity,
      message: `Equipo ${eq.code} lleva ${eq.daysInRepair} días en reparación`,
      entityId: eq.id,
      entityCode: eq.code,
      createdAt: now,
    });
  });

  // Alerta de pagos pendientes altos
  if (data.pendingPayments > 5000) {
    alerts.push({
      id: `pending-payments-${now.getTime()}`,
      type: "PENDING_PAYMENT",
      severity: data.pendingPayments > 10000 ? "HIGH" : "MEDIUM",
      message: `Pagos pendientes: S/ ${data.pendingPayments.toFixed(2)}`,
      createdAt: now,
    });
  }

  // Alerta de gastos excesivos
  if (data.monthIncome > 0 && data.monthExpenses > data.monthIncome * 0.7) {
    alerts.push({
      id: `high-expenses-${now.getTime()}`,
      type: "HIGH_EXPENSES",
      severity: data.monthExpenses > data.monthIncome ? "CRITICAL" : "HIGH",
      message: `Gastos del mes (S/ ${data.monthExpenses.toFixed(
        2
      )}) representan ${((data.monthExpenses / data.monthIncome) * 100).toFixed(
        1
      )}% de ingresos`,
      createdAt: now,
    });
  }

  // Alerta de ingresos bajos
  const expectedMonthIncome = 5000; // Umbral configurable
  if (data.monthIncome < expectedMonthIncome) {
    alerts.push({
      id: `low-revenue-${now.getTime()}`,
      type: "LOW_REVENUE",
      severity: data.monthIncome < expectedMonthIncome * 0.5 ? "HIGH" : "MEDIUM",
      message: `Ingresos del mes (S/ ${data.monthIncome.toFixed(
        2
      )}) por debajo del objetivo`,
      createdAt: now,
    });
  }

  return alerts.sort((a, b) => {
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

// ============ UTILIDADES DE FORMATO ============

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-PE").format(value);
}
