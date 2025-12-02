// src/app/api/reports/technician-payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { TechnicianPaymentsResponse } from "@/types/reports";

// GET /api/reports/technician-payments - Obtener pagos detallados a técnicos
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const technicianId = searchParams.get("technicianId");

    // Construir filtros de fecha
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) {
      // Crear fecha en zona horaria local (Perú)
      const startDateTime = new Date(startDate + "T00:00:00");
      dateFilter.gte = startDateTime;
    }
    if (endDate) {
      // Crear fecha en zona horaria local (Perú) y ajustar al final del día
      const endDateTime = new Date(endDate + "T23:59:59.999");
      dateFilter.lte = endDateTime;
    }

    // Construir filtro de técnico
    // El filtro viene como ID, pero beneficiary almacena el NOMBRE
    // Necesitamos obtener el nombre del técnico primero
    let beneficiaryFilter: string | undefined = undefined;
    if (technicianId) {
      const technician = await prisma.user.findUnique({
        where: { id: technicianId },
        select: { name: true },
      });
      beneficiaryFilter = technician?.name;
    }

    // Obtener todos los pagos a técnicos (adelantos y salarios)
    const expenses = await prisma.expense.findMany({
      where: {
        type: {
          in: ["ADVANCE", "SALARY"],
        },
        ...(Object.keys(dateFilter).length > 0 && {
          expenseDate: dateFilter,
        }),
        ...(beneficiaryFilter && {
          beneficiary: beneficiaryFilter,
        }),
      },
      select: {
        id: true,
        type: true,
        amount: true,
        beneficiary: true,
        description: true,
        paymentMethod: true,
        expenseDate: true,
        observations: true,
      },
      orderBy: {
        expenseDate: "desc",
      },
    });

    // El campo beneficiary contiene el NOMBRE del técnico (texto), no el ID
    // Por lo tanto, usamos directamente el nombre almacenado

    // Transformar datos
    const payments = expenses.map((expense) => ({
      id: expense.id,
      date: expense.expenseDate,
      type: expense.type as "ADVANCE" | "SALARY",
      amount: expense.amount,
      technicianId: expense.beneficiary || "",
      technicianName: expense.beneficiary || "Sin asignar",
      paymentMethod: expense.paymentMethod,
      description: expense.description,
      observations: expense.observations,
    }));

    // Calcular totales
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalAdvances = payments
      .filter((p) => p.type === "ADVANCE")
      .reduce((sum, p) => sum + p.amount, 0);
    const totalSalaries = payments
      .filter((p) => p.type === "SALARY")
      .reduce((sum, p) => sum + p.amount, 0);

    const response: TechnicianPaymentsResponse = {
      payments,
      total: payments.length,
      totalAmount,
      totalAdvances,
      totalSalaries,
      filters: {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        technicianId: technicianId || undefined,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error obteniendo pagos a técnicos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
