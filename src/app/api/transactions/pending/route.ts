// src/app/api/transactions/pending/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ConsolidatedTransaction } from "@/types/finance";

// GET /api/transactions/pending - detalles de equipos con pagos pendientes o sin pago
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Buscar equipos que: 1) tengan al menos un pago PENDING/PARTIAL y no estén cancelados/entregados,
    // o 2) estén en estados activos y no tengan ningún pago.
    const equipments = await prisma.equipment.findMany({
      where: {
        status: { notIn: ["CANCELLED", "DELIVERED"] },
        OR: [
          {
            payments: {
              some: {
                paymentStatus: { in: ["PENDING", "PARTIAL"] },
              },
            },
          },
          {
            payments: { none: {} },
            status: { in: ["RECEIVED", "REPAIR", "REPAIRED"] },
          },
        ],
      },
      include: {
        customer: true,
        payments: {
          where: { paymentStatus: { in: ["PENDING", "PARTIAL"] } },
          orderBy: { paymentDate: "asc" },
          take: 1, // sólo necesitamos el primero relevante
        },
      },
    });

    const transactions: ConsolidatedTransaction[] = equipments.map((eq) => {
      if (eq.payments.length > 0) {
        const payment = eq.payments[0];
        const displayAmount =
          payment.advanceAmount < payment.totalAmount
            ? payment.advanceAmount
            : payment.totalAmount;

        let paymentLabel: string;
        const isRemainingPayment = payment.observations === "Pago restante";
        if (isRemainingPayment) {
          paymentLabel = "Pago restante";
        } else if (payment.paymentStatus === "PARTIAL") {
          paymentLabel = "Adelanto";
        } else if (payment.paymentStatus === "COMPLETED") {
          paymentLabel = "Pago completo";
        } else {
          paymentLabel = "Pago";
        }

        return {
          id: payment.id,
          date: payment.paymentDate,
          type: "INGRESO",
          description: `${paymentLabel} equipo ${eq.code} - ${eq.customer.name}`,
          amount: displayAmount,
          paymentMethod: payment.paymentMethod,
          category: payment.paymentStatus,
          observations: payment.observations,
          equipmentCode: eq.code,
          equipmentServiceType: eq.serviceType,
          voucherType: payment.voucherType,
          paymentStatus: payment.paymentStatus,
          beneficiary: payment.beneficiary || "RJD",
        } as ConsolidatedTransaction;
      } else {
        // Equipo sin pagos
        return {
          id: eq.id,
          date: eq.entryDate,
          type: "INGRESO",
          description: `Sin pago equipo ${eq.code} - ${eq.customer.name}`,
          amount: 0,
          paymentMethod: "CASH",
          category: "PENDING",
          observations: null,
          equipmentCode: eq.code,
          equipmentServiceType: eq.serviceType,
          beneficiary: "RJD",
        } as ConsolidatedTransaction;
      }
    });

    return NextResponse.json({ transactions, total: transactions.length });
  } catch (error) {
    console.error("Error obteniendo pagos pendientes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
