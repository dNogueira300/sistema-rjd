// src/app/api/payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema de validación para crear/actualizar pago
const paymentSchema = z.object({
  equipmentId: z.string().cuid("ID de equipo inválido"),
  totalAmount: z.number().min(0, "El monto total debe ser mayor o igual a 0"),
  advanceAmount: z.number().min(0, "El adelanto debe ser mayor o igual a 0"),
  paymentMethod: z.enum(["CASH", "YAPE", "PLIN", "TRANSFER"]),
  voucherType: z.enum(["RECEIPT", "INVOICE", "DELIVERY_NOTE"]).default("RECEIPT"),
  observations: z.string().max(500).optional(),
});

// POST /api/payments - Crear nuevo pago
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo administradores pueden registrar pagos
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json(
        { error: "Permisos insuficientes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = paymentSchema.parse(body);

    // Verificar que el equipo existe
    const equipment = await prisma.equipment.findUnique({
      where: { id: validatedData.equipmentId },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipo no encontrado" },
        { status: 404 }
      );
    }

    // Calcular monto restante
    const remainingAmount = validatedData.totalAmount - validatedData.advanceAmount;

    // Determinar estado del pago
    let paymentStatus: "PENDING" | "PARTIAL" | "COMPLETED";
    if (validatedData.advanceAmount === 0) {
      paymentStatus = "PENDING";
    } else if (validatedData.advanceAmount >= validatedData.totalAmount) {
      paymentStatus = "COMPLETED";
    } else {
      paymentStatus = "PARTIAL";
    }

    // Crear pago (beneficiario es RJD - el negocio)
    const payment = await prisma.payment.create({
      data: {
        equipmentId: validatedData.equipmentId,
        totalAmount: validatedData.totalAmount,
        advanceAmount: validatedData.advanceAmount,
        remainingAmount: Math.max(0, remainingAmount),
        paymentMethod: validatedData.paymentMethod,
        voucherType: validatedData.voucherType,
        paymentStatus,
        beneficiary: "RJD",
        observations: validatedData.observations || null,
      },
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("Error creando pago:", error);

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
