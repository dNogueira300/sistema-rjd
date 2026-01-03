// src/app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transactionFiltersSchema } from "@/lib/validations/finance";
import type { ConsolidatedTransaction } from "@/types/finance";

// GET /api/transactions - Obtener transacciones consolidadas (Ingresos + Egresos)
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

    const { searchParams } = new URL(request.url);

    // Parsear y validar filtros
    const filters = transactionFiltersSchema.parse({
      type: searchParams.get("type") || "ALL",
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      search: searchParams.get("search") || "",
      paymentMethod: searchParams.get("paymentMethod") || "ALL",
      technicianId: searchParams.get("technicianId") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      sortBy: searchParams.get("sortBy") || "date",
      sortOrder: searchParams.get("sortOrder") || "desc",
    });

    // Construir filtros de fecha
    const dateFilter = {
      ...(filters.startDate && { gte: new Date(filters.startDate) }),
      ...(filters.endDate && { lte: new Date(filters.endDate) }),
    };

    // Construir filtro de método de pago
    const paymentMethodFilter =
      filters.paymentMethod && filters.paymentMethod !== "ALL"
        ? filters.paymentMethod
        : undefined;

    // Obtener Ingresos (Payments) con select optimizado - Excluyendo equipos cancelados
    const includeIncome = filters.type === "ALL" || filters.type === "INGRESO";
    const incomePromise = includeIncome
      ? prisma.payment.findMany({
          where: {
            ...(Object.keys(dateFilter).length > 0 && {
              paymentDate: dateFilter,
            }),
            ...(paymentMethodFilter && { paymentMethod: paymentMethodFilter }),
            // Excluir pagos de equipos cancelados
            equipment: {
              status: {
                not: "CANCELLED",
              },
              ...(filters.technicianId && {
                assignedTechnicianId: filters.technicianId,
              }),
              ...(filters.search && {
                OR: [
                  { code: { contains: filters.search, mode: "insensitive" } },
                  {
                    customer: {
                      name: { contains: filters.search, mode: "insensitive" },
                    },
                  },
                ],
              }),
            },
          },
          select: {
            id: true,
            paymentDate: true,
            totalAmount: true,
            advanceAmount: true,
            paymentMethod: true,
            paymentStatus: true,
            voucherType: true,
            observations: true,
            beneficiary: true,
            equipment: {
              select: {
                code: true,
                serviceType: true,
                customer: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            paymentDate:
              filters.sortBy === "date" ? filters.sortOrder : undefined,
          },
        })
      : Promise.resolve([]);

    // Obtener Egresos (Expenses) con select optimizado
    const includeExpenses = filters.type === "ALL" || filters.type === "EGRESO";
    const expensesPromise = includeExpenses
      ? prisma.expense.findMany({
          where: {
            ...(Object.keys(dateFilter).length > 0 && {
              expenseDate: dateFilter,
            }),
            ...(paymentMethodFilter && { paymentMethod: paymentMethodFilter }),
            ...(filters.search && {
              OR: [
                { description: { contains: filters.search, mode: "insensitive" } },
                { beneficiary: { contains: filters.search, mode: "insensitive" } },
              ],
            }),
          },
          select: {
            id: true,
            expenseDate: true,
            description: true,
            amount: true,
            paymentMethod: true,
            type: true,
            observations: true,
            beneficiary: true,
          },
          orderBy: {
            expenseDate:
              filters.sortBy === "date" ? filters.sortOrder : undefined,
          },
        })
      : Promise.resolve([]);

    const [payments, expenses] = await Promise.all([
      incomePromise,
      expensesPromise,
    ]);

    // Consolidar transacciones
    const transactions: ConsolidatedTransaction[] = [];

    // Agregar ingresos
    payments.forEach((payment) => {
      // Mostrar el monto pagado (advanceAmount) si hay diferencia con el total
      // Si no hay diferencia, mostrar el total
      const displayAmount = payment.advanceAmount < payment.totalAmount
        ? payment.advanceAmount
        : payment.totalAmount;

      transactions.push({
        id: payment.id,
        date: payment.paymentDate,
        type: "INGRESO",
        description: `Pago equipo ${payment.equipment.code} - ${payment.equipment.customer.name}`,
        amount: displayAmount,
        paymentMethod: payment.paymentMethod,
        category: payment.paymentStatus,
        observations: payment.observations,
        equipmentCode: payment.equipment.code,
        equipmentServiceType: payment.equipment.serviceType,
        voucherType: payment.voucherType,
        paymentStatus: payment.paymentStatus,
        beneficiary: payment.beneficiary || "RJD",
      });
    });

    // Agregar egresos
    expenses.forEach((expense) => {
      transactions.push({
        id: expense.id,
        date: expense.expenseDate,
        type: "EGRESO",
        description: expense.description,
        amount: expense.amount,
        paymentMethod: expense.paymentMethod,
        category: expense.type,
        observations: expense.observations,
        beneficiary: expense.beneficiary || undefined,
        expenseType: expense.type,
      });
    });

    // Ordenar transacciones consolidadas
    transactions.sort((a, b) => {
      if (filters.sortBy === "date") {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return filters.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else if (filters.sortBy === "amount") {
        return filters.sortOrder === "asc"
          ? a.amount - b.amount
          : b.amount - a.amount;
      } else if (filters.sortBy === "type") {
        const comparison = a.type.localeCompare(b.type);
        return filters.sortOrder === "asc" ? comparison : -comparison;
      }
      return 0;
    });

    // Calcular métricas del periodo si hay filtros de fecha
    let periodMetrics = undefined;
    if (filters.startDate || filters.endDate) {
      const income = transactions
        .filter(t => t.type === "INGRESO")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = transactions
        .filter(t => t.type === "EGRESO")
        .reduce((sum, t) => sum + t.amount, 0);

      periodMetrics = {
        income,
        expenses,
        difference: income - expenses,
      };
    }

    // Paginación
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedTransactions = transactions.slice(startIndex, endIndex);
    const total = transactions.length;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      transactions: paginatedTransactions,
      total,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      periodMetrics,
    });
  } catch (error) {
    console.error("Error obteniendo transacciones:", error);

    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
