// src/app/api/payments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Schema de validación para actualizar pago
const updatePaymentSchema = z.object({
  totalAmount: z.number().min(0).optional(),
  advanceAmount: z.number().min(0).optional(),
  paymentMethod: z.enum(["CASH", "YAPE", "PLIN", "TRANSFER"]).optional(),
  voucherType: z.enum(["RECEIPT", "INVOICE", "DELIVERY_NOTE"]).optional(),
  observations: z.string().max(500).optional().nullable(),
});

// PUT /api/payments/[id] - Actualizar pago
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
    const validatedData = updatePaymentSchema.parse(body);

    // Verificar que el pago existe
    const existingPayment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 }
      );
    }

    // Calcular nuevos valores
    const totalAmount = validatedData.totalAmount ?? existingPayment.totalAmount;
    const advanceAmount = validatedData.advanceAmount ?? existingPayment.advanceAmount;
    const remainingAmount = Math.max(0, totalAmount - advanceAmount);

    // Determinar estado del pago
    let paymentStatus: "PENDING" | "PARTIAL" | "COMPLETED";
    if (advanceAmount === 0) {
      paymentStatus = "PENDING";
    } else if (advanceAmount >= totalAmount) {
      paymentStatus = "COMPLETED";
    } else {
      paymentStatus = "PARTIAL";
    }

    // Actualizar pago (actualizar fecha para que se ordene correctamente)
    const payment = await prisma.payment.update({
      where: { id },
      data: {
        totalAmount,
        advanceAmount,
        remainingAmount,
        paymentStatus,
        paymentMethod: validatedData.paymentMethod,
        voucherType: validatedData.voucherType,
        observations: validatedData.observations,
        paymentDate: new Date(), // Actualizar fecha para ordenamiento correcto
      },
    });

    return NextResponse.json({ payment });
  } catch (error) {
    console.error("Error actualizando pago:", error);

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

// DELETE /api/payments/[id] - Eliminar pago
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Verificar que el pago existe
    const existingPayment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 }
      );
    }

    await prisma.payment.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Pago eliminado exitosamente" });
  } catch (error) {
    console.error("Error eliminando pago:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
