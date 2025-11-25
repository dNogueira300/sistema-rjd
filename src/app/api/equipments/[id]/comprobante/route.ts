// src/app/api/equipments/[id]/comprobante/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateComprobanteIngreso } from "@/lib/pdf-generator";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Buscar el equipo con toda la información necesaria
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        assignedTechnician: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payments: {
          select: {
            id: true,
            totalAmount: true,
            advanceAmount: true,
            remainingAmount: true,
            paymentDate: true,
            paymentMethod: true,
            voucherType: true,
            paymentStatus: true,
          },
        },
      },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipo no encontrado" },
        { status: 404 }
      );
    }

    // Generar PDF (castear al tipo correcto)
    const pdfBuffer = generateComprobanteIngreso({
      equipment: equipment as Parameters<typeof generateComprobanteIngreso>[0]['equipment']
    });

    // Retornar PDF con headers apropiados
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="comprobante-${equipment.code}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generando comprobante:", error);
    return NextResponse.json(
      { error: "Error al generar el comprobante" },
      { status: 500 }
    );
  }
}
