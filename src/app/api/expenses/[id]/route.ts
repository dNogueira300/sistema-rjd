// src/app/api/expenses/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Schema de validación para actualizar egreso
const updateExpenseSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  amount: z.number().min(0).optional(),
  beneficiary: z.string().max(200).optional().nullable(),
  paymentMethod: z.enum(["CASH", "YAPE", "PLIN", "TRANSFER"]).optional(),
});

// PUT /api/expenses/[id] - Actualizar egreso
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json(
        { error: "Permisos insuficientes" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateExpenseSchema.parse(body);

    // Verificar que el egreso existe
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { error: "Egreso no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar egreso
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...validatedData,
      },
    });

    return NextResponse.json({ expense });
  } catch (error) {
    console.error("Error actualizando egreso:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
