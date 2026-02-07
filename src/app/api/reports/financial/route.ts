// src/app/api/reports/financial/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calculateFinancialKPIs,
  calculateDailyRevenue,
  generateAlerts,
  getDaysBetween,
  getDateRange,
} from "@/lib/reports";
import type {
  FinancialReportResponse,
  ReportFilters,
  PeriodRevenue,
  TechnicianPerformance,
  TechnicianExpense,
} from "@/types/reports";

// GET /api/reports/financial - Reporte financiero completo
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo administradores pueden ver reportes financieros
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    // Parsear filtros
    const filters: ReportFilters = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      technicianId: searchParams.get("technicianId") || undefined,
    };

    // Obtener rangos de fechas
    const todayRange = getDateRange("today");
    const monthRange = getDateRange("month");
    const last30DaysRange = getDateRange("week");
    last30DaysRange.startDate.setDate(last30DaysRange.startDate.getDate() - 23); // 30 días atrás

    // Rango para análisis personalizado
    const analysisRange =
      filters.startDate && filters.endDate
        ? {
            startDate: new Date(filters.startDate),
            endDate: new Date(filters.endDate + "T23:59:59.999"),
          }
        : monthRange;

    // Rango para KPIs del período (dinámico según filtros)
    const periodRange = filters.startDate && filters.endDate ? analysisRange : monthRange;

    // ============ OBTENER DATOS EN PARALELO ============

    const [
      todayPayments,
      monthPayments,
      todayExpenses,
      monthExpenses,
      last30DaysPayments,
      last30DaysExpenses,
      pendingPayments,
      periodEquipments,
      overdueEquipments,
      periodExpensesData,
      allTechEquipments,
      periodAdvances,
      periodSalaries,
    ] = await Promise.all([
      // Pagos de hoy (fijo, no cambia con filtros)
      prisma.payment.findMany({
        where: {
          paymentDate: {
            gte: todayRange.startDate,
            lte: todayRange.endDate,
          },
          equipment: {
            status: { not: "CANCELLED" },
          },
        },
        select: {
          totalAmount: true,
          advanceAmount: true,
        },
      }),

      // Pagos del período (mes o rango personalizado)
      prisma.payment.findMany({
        where: {
          paymentDate: {
            gte: periodRange.startDate,
            lte: periodRange.endDate,
          },
          equipment: {
            status: { not: "CANCELLED" },
          },
        },
        select: {
          totalAmount: true,
          advanceAmount: true,
          paymentDate: true,
        },
      }),

      // Gastos de hoy (fijo, no cambia con filtros)
      prisma.expense.findMany({
        where: {
          expenseDate: {
            gte: todayRange.startDate,
            lte: todayRange.endDate,
          },
        },
        select: {
          amount: true,
        },
      }),

      // Gastos del período (mes o rango personalizado)
      prisma.expense.findMany({
        where: {
          expenseDate: {
            gte: periodRange.startDate,
            lte: periodRange.endDate,
          },
        },
        select: {
          amount: true,
          expenseDate: true,
        },
      }),

      // Pagos para últimos 30 días (para gráfico)
      prisma.payment.findMany({
        where: {
          paymentDate: {
            gte: last30DaysRange.startDate,
            lte: last30DaysRange.endDate,
          },
          equipment: {
            status: { not: "CANCELLED" },
          },
        },
        select: {
          paymentDate: true,
          totalAmount: true,
          advanceAmount: true,
        },
      }),

      // Gastos para últimos 30 días
      prisma.expense.findMany({
        where: {
          expenseDate: {
            gte: last30DaysRange.startDate,
            lte: last30DaysRange.endDate,
          },
        },
        select: {
          expenseDate: true,
          amount: true,
        },
      }),

      // Pagos pendientes (equipos entregados con saldo pendiente)
      prisma.payment.findMany({
        where: {
          paymentStatus: { in: ["PENDING", "PARTIAL"] },
          equipment: {
            status: "DELIVERED",
          },
        },
        select: {
          remainingAmount: true,
        },
      }),

      // Equipos para análisis de período
      prisma.equipment.findMany({
        where: {
          entryDate: {
            gte: analysisRange.startDate,
            lte: analysisRange.endDate,
          },
          status: { not: "CANCELLED" },
          ...(filters.technicianId && {
            assignedTechnicianId: filters.technicianId,
          }),
        },
        select: {
          id: true,
          entryDate: true,
          deliveryDate: true,
          assignedTechnicianId: true,
          assignedTechnician: {
            select: {
              id: true,
              name: true,
            },
          },
          payments: {
            select: {
              totalAmount: true,
              advanceAmount: true,
            },
          },
        },
      }),

      // Equipos vencidos para alertas
      prisma.equipment.findMany({
        where: {
          status: "REPAIR",
        },
        select: {
          id: true,
          code: true,
          entryDate: true,
        },
      }),

      // Gastos del período para análisis
      prisma.expense.findMany({
        where: {
          expenseDate: {
            gte: analysisRange.startDate,
            lte: analysisRange.endDate,
          },
        },
        select: {
          amount: true,
          expenseDate: true,
        },
      }),

      // Todos los equipos asignados para contar por técnico
      prisma.equipment.findMany({
        where: {
          entryDate: {
            gte: analysisRange.startDate,
            lte: analysisRange.endDate,
          },
          status: { not: "CANCELLED" },
          assignedTechnicianId: { not: null },
        },
        select: {
          assignedTechnicianId: true,
        },
      }),

      // Adelantos del período
      prisma.advance.findMany({
        where: {
          paidDate: {
            gte: analysisRange.startDate,
            lte: analysisRange.endDate,
          },
          status: "PAID",
        },
        select: {
          userId: true,
          amount: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      // Salarios del período
      prisma.payrollRecord.findMany({
        where: {
          payDate: {
            gte: analysisRange.startDate,
            lte: analysisRange.endDate,
          },
        },
        select: {
          userId: true,
          amount: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    // ============ CALCULAR MÉTRICAS ============

    // KPIs
    const todayIncome = todayPayments.reduce((sum, p) => {
      const amount =
        p.advanceAmount < p.totalAmount ? p.advanceAmount : p.totalAmount;
      return sum + amount;
    }, 0);

    const todayExpensesTotal = todayExpenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );

    const monthIncome = monthPayments.reduce((sum, p) => {
      const amount =
        p.advanceAmount < p.totalAmount ? p.advanceAmount : p.totalAmount;
      return sum + amount;
    }, 0);

    const monthExpensesTotal = monthExpenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );

    const pendingPaymentsTotal = pendingPayments.reduce(
      (sum, p) => sum + p.remainingAmount,
      0
    );

    const totalRevenue = monthIncome; // Puede extenderse a todo el tiempo

    const kpis = calculateFinancialKPIs({
      todayIncome,
      todayExpenses: todayExpensesTotal,
      monthIncome,
      monthExpenses: monthExpensesTotal,
      pendingPayments: pendingPaymentsTotal,
      totalRevenue,
    });

    // Gráfico diario (últimos 30 días)
    const dailyRevenue = calculateDailyRevenue(
      last30DaysPayments,
      last30DaysExpenses
    );

    // Análisis de período
    const periodIncome = periodEquipments.reduce((sum, eq) => {
      const revenue = eq.payments.reduce((pSum, p) => {
        const amount =
          p.advanceAmount < p.totalAmount ? p.advanceAmount : p.totalAmount;
        return pSum + amount;
      }, 0);
      return sum + revenue;
    }, 0);

    const periodExpensesTotal = periodExpensesData.reduce(
      (sum, e) => sum + e.amount,
      0
    );

    // Revenue por período (agrupado por mes si el rango es >31 días)
    const daysDiff = getDaysBetween(
      analysisRange.startDate,
      analysisRange.endDate
    );
    const groupByMonth = daysDiff > 31;

    const periodRevenue: PeriodRevenue[] = [];

    if (groupByMonth) {
      // Agrupar por mes
      const monthlyData = new Map<string, PeriodRevenue>();

      periodEquipments.forEach((eq) => {
        const monthKey = eq.entryDate.toISOString().slice(0, 7); // YYYY-MM

        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            period: monthKey,
            income: 0,
            expenses: 0,
            profit: 0,
            profitMargin: 0,
            equipmentCount: 0,
          });
        }

        const data = monthlyData.get(monthKey)!;
        data.equipmentCount++;

        const revenue = eq.payments.reduce((sum, p) => {
          const amount =
            p.advanceAmount < p.totalAmount ? p.advanceAmount : p.totalAmount;
          return sum + amount;
        }, 0);
        data.income += revenue;
      });

      // Agregar gastos por mes
      periodExpensesData.forEach((expense) => {
        const expenseDate = new Date(
          (expense as unknown as { expenseDate: Date }).expenseDate
        );
        const monthKey = expenseDate.toISOString().slice(0, 7);
        const data = monthlyData.get(monthKey);
        if (data) {
          data.expenses += expense.amount;
        }
      });

      // Calcular profit y profit margin
      monthlyData.forEach((data) => {
        data.profit = data.income - data.expenses;
        data.profitMargin =
          data.income > 0 ? (data.profit / data.income) * 100 : 0;
      });

      periodRevenue.push(...Array.from(monthlyData.values()));
    } else {
      // Retornar como un solo período
      const profit = periodIncome - periodExpensesTotal;
      periodRevenue.push({
        period: "Total",
        income: periodIncome,
        expenses: periodExpensesTotal,
        profit,
        profitMargin: periodIncome > 0 ? (profit / periodIncome) * 100 : 0,
        equipmentCount: periodEquipments.length,
      });
    }

    // Top técnicos
    const technicianMap = new Map<string, TechnicianPerformance>();

    // Contar asignados por técnico (datos ya obtenidos en Promise.all)
    const assignedCount = new Map<string, number>();
    allTechEquipments.forEach((eq) => {
      if (eq.assignedTechnicianId) {
        assignedCount.set(
          eq.assignedTechnicianId,
          (assignedCount.get(eq.assignedTechnicianId) || 0) + 1
        );
      }
    });

    periodEquipments.forEach((eq) => {
      if (eq.assignedTechnician && eq.deliveryDate) {
        const techId = eq.assignedTechnician.id;

        if (!technicianMap.has(techId)) {
          technicianMap.set(techId, {
            technicianId: techId,
            technicianName: eq.assignedTechnician.name,
            assignedCount: assignedCount.get(techId) || 0,
            completedCount: 0,
            averageDays: 0,
            revenue: 0,
          });
        }

        const tech = technicianMap.get(techId)!;
        tech.completedCount++;

        const revenue = eq.payments.reduce((sum, p) => {
          const amount =
            p.advanceAmount < p.totalAmount ? p.advanceAmount : p.totalAmount;
          return sum + amount;
        }, 0);
        tech.revenue += revenue;
      }
    });

    const topTechnicians = Array.from(technicianMap.values()).map((tech) => {
      // Calcular días promedio
      const techEquipments = periodEquipments.filter(
        (eq) => eq.assignedTechnicianId === tech.technicianId && eq.deliveryDate
      );

      if (techEquipments.length > 0) {
        const totalDays = techEquipments.reduce(
          (sum, eq) => sum + getDaysBetween(eq.entryDate, eq.deliveryDate!),
          0
        );
        tech.averageDays =
          Math.round((totalDays / techEquipments.length) * 10) / 10;
      }

      return tech;
    });

    // Ordenar por revenue total
    topTechnicians.sort((a, b) => b.revenue - a.revenue);

    // ====== CALCULAR GASTOS DE TÉCNICOS ======
    const technicianExpensesMap = new Map<string, TechnicianExpense>();

    // Procesar adelantos
    periodAdvances.forEach((advance) => {
      if (!technicianExpensesMap.has(advance.userId)) {
        technicianExpensesMap.set(advance.userId, {
          technicianId: advance.userId,
          technicianName: advance.user.name,
          totalAdvances: 0,
          totalSalaries: 0,
          totalExpenses: 0,
          advanceCount: 0,
          salaryCount: 0,
        });
      }

      const techExpense = technicianExpensesMap.get(advance.userId)!;
      techExpense.totalAdvances += advance.amount;
      techExpense.advanceCount += 1;
      techExpense.totalExpenses += advance.amount;
    });

    // Procesar salarios
    periodSalaries.forEach((salary) => {
      if (!technicianExpensesMap.has(salary.userId)) {
        technicianExpensesMap.set(salary.userId, {
          technicianId: salary.userId,
          technicianName: salary.user.name,
          totalAdvances: 0,
          totalSalaries: 0,
          totalExpenses: 0,
          advanceCount: 0,
          salaryCount: 0,
        });
      }

      const techExpense = technicianExpensesMap.get(salary.userId)!;
      techExpense.totalSalaries += salary.amount;
      techExpense.salaryCount += 1;
      techExpense.totalExpenses += salary.amount;
    });

    const technicianExpenses = Array.from(technicianExpensesMap.values()).sort(
      (a, b) => b.totalExpenses - a.totalExpenses
    );

    // Alertas
    const now = new Date();
    const overdueData = overdueEquipments.map((eq) => ({
      id: eq.id,
      code: eq.code,
      daysInRepair: getDaysBetween(eq.entryDate, now),
    }));

    const alerts = generateAlerts({
      overdueEquipments: overdueData,
      pendingPayments: pendingPaymentsTotal,
      monthExpenses: monthExpensesTotal,
      monthIncome,
    });

    const response: FinancialReportResponse = {
      kpis,
      dailyRevenue,
      periodRevenue,
      revenueAnalysis: periodRevenue, // Usar periodRevenue directamente
      topTechnicians,
      technicianExpenses,
      alerts,
      filters,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generando reporte financiero:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
