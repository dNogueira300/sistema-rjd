// src/app/api/expenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createExpenseSchema } from "@/lib/validations/finance";

// POST /api/expenses - Crear nuevo egreso
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo administradores pueden crear egresos
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();

    // Validar datos de entrada
    const validatedData = createExpenseSchema.parse(body);

    // Determinar beneficiario según tipo de egreso
    let beneficiary: string;
    if (validatedData.expenseType === "ADVANCE" || validatedData.expenseType === "SALARY") {
      // Para adelantos y salarios, el beneficiario es el trabajador
      beneficiary = validatedData.beneficiary || "Trabajador";
    } else {
      // Para otros egresos (compras, alquiler, servicios, etc.), el beneficiario es RJD
      beneficiary = "RJD";
    }

    // Crear el egreso
    const expense = await prisma.expense.create({
      data: {
        type: validatedData.expenseType,
        description: validatedData.description,
        amount: validatedData.amount,
        beneficiary,
        paymentMethod: validatedData.paymentMethod,
        expenseDate: validatedData.expenseDate
          ? new Date(validatedData.expenseDate)
          : new Date(),
        observations: validatedData.observations || null,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      expense,
      message: "Egreso registrado correctamente",
    });
  } catch (error) {
    console.error("Error creando egreso:", error);

    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
