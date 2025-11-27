// src/app/api/transactions/metrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FinanceMetrics } from "@/types/finance";

// GET /api/transactions/metrics - Obtener métricas financieras
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo administradores pueden ver finanzas
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Fechas para cálculos
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfNextMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      1
    );

    // Ingresos del día (excluyendo pagos de equipos cancelados)
    // Sumar solo el monto pagado (advanceAmount), no el total
    const todayIncomeResult = await prisma.payment.aggregate({
      where: {
        paymentDate: {
          gte: today,
          lt: tomorrow,
        },
        equipment: {
          status: {
            not: "CANCELLED",
          },
        },
      },
      _sum: {
        advanceAmount: true, // Cambiado de totalAmount a advanceAmount
      },
    });

    // Egresos del día
    const todayExpensesResult = await prisma.expense.aggregate({
      where: {
        expenseDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Ingresos del mes (excluyendo pagos de equipos cancelados)
    // Sumar solo el monto pagado (advanceAmount), no el total
    const monthIncomeResult = await prisma.payment.aggregate({
      where: {
        paymentDate: {
          gte: firstDayOfMonth,
          lt: firstDayOfNextMonth,
        },
        equipment: {
          status: {
            not: "CANCELLED",
          },
        },
      },
      _sum: {
        advanceAmount: true, // Cambiado de totalAmount a advanceAmount
      },
    });

    // Egresos del mes
    const monthExpensesResult = await prisma.expense.aggregate({
      where: {
        expenseDate: {
          gte: firstDayOfMonth,
          lt: firstDayOfNextMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Pagos pendientes (contar equipos únicos con pago pendiente, parcial o sin pago)
    // Excluir equipos cancelados y entregados

    // 1. Equipos con pagos pendientes o parciales (excluir cancelados)
    const equipmentsWithPendingPayments = await prisma.payment.groupBy({
      by: ["equipmentId"],
      where: {
        paymentStatus: {
          in: ["PENDING", "PARTIAL"],
        },
        equipment: {
          status: {
            notIn: ["CANCELLED", "DELIVERED"],
          },
        },
      },
    });

    // 2. Equipos sin ningún pago registrado (activos: RECEIVED, REPAIR, REPAIRED)
    const equipmentsWithoutPayment = await prisma.equipment.count({
      where: {
        status: {
          in: ["RECEIVED", "REPAIR", "REPAIRED"],
        },
        payments: {
          none: {},
        },
      },
    });

    const pendingPaymentsCount = equipmentsWithPendingPayments.length + equipmentsWithoutPayment;

    // Adelantos pendientes
    const pendingAdvancesCount = await prisma.advance.count({
      where: {
        status: "PENDING",
      },
    });

    const todayIncome = todayIncomeResult._sum.advanceAmount || 0;
    const todayExpenses = todayExpensesResult._sum.amount || 0;
    const monthIncome = monthIncomeResult._sum.advanceAmount || 0;
    const monthExpenses = monthExpensesResult._sum.amount || 0;

    const balance = todayIncome - todayExpenses;
    const monthlyProfitability =
      monthIncome > 0 ? ((monthIncome - monthExpenses) / monthIncome) * 100 : 0;

    const metrics: FinanceMetrics = {
      todayIncome,
      todayExpenses,
      balance,
      monthlyProfitability,
      pendingPayments: pendingPaymentsCount,
      pendingAdvances: pendingAdvancesCount,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error obteniendo métricas:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
