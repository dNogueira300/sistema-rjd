// src/app/api/equipments/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changeStatusSchema } from "@/lib/validations/equipment";
import type { EquipmentStatus } from "@/types/equipment";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/equipments/[id]/status - Cambiar estado del equipo
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validar datos de entrada
    const validatedData = changeStatusSchema.parse(body);

    // Verificar que el equipo existe (incluir pagos)
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        payments: true,
      },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipo no encontrado" },
        { status: 404 }
      );
    }

    const userRole = session.user.role as "ADMINISTRADOR" | "TECNICO";

    // Validar permisos según rol
    if (userRole === "TECNICO") {
      // Técnicos solo pueden marcar como REPAIRED si está en REPAIR y es su equipo
      if (validatedData.newStatus !== "REPAIRED") {
        return NextResponse.json(
          { error: "Los técnicos solo pueden marcar equipos como reparados" },
          { status: 403 }
        );
      }

      if (equipment.status !== "REPAIR") {
        return NextResponse.json(
          { error: "Solo se pueden marcar como reparados equipos en reparación" },
          { status: 400 }
        );
      }

      if (equipment.assignedTechnicianId !== session.user.id) {
        return NextResponse.json(
          { error: "No puedes marcar como reparado un equipo que no te está asignado" },
          { status: 403 }
        );
      }
    }

    // Validar que existe pago total antes de marcar como ENTREGADO
    if (validatedData.newStatus === "DELIVERED") {
      const hasCompletedPayment = equipment.payments?.some(
        (payment) => payment.paymentStatus === "COMPLETED"
      );

      if (!hasCompletedPayment) {
        return NextResponse.json(
          { error: "No se puede marcar como entregado sin un pago total completado" },
          { status: 400 }
        );
      }
    }

    // Los administradores pueden cambiar a cualquier estado libremente (con las validaciones anteriores)

    // Actualizar estado del equipo
    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: {
        status: validatedData.newStatus as EquipmentStatus,
        deliveryDate:
          validatedData.newStatus === "DELIVERED" ? new Date() : undefined,
      },
    });

    // Crear entrada en historial de estados
    await prisma.equipmentStatusHistory.create({
      data: {
        equipmentId: id,
        status: validatedData.newStatus as EquipmentStatus,
        observations: validatedData.observations || null,
        changedBy: session.user.id,
      },
    });

    return NextResponse.json({
      equipment: updatedEquipment,
      message: "Estado actualizado correctamente",
    });
  } catch (error) {
    console.error("Error cambiando estado:", error);

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
