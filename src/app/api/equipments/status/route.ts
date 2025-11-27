// src/app/api/equipments/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  changeStatusSchema,
  isValidStatusTransition,
} from "@/lib/validations/equipment";
import type { Equipment, EquipmentStatusHistoryItem, EquipmentStatus } from "@/types/equipment";

// Tipo para historial de Prisma
interface PrismaHistoryEntry {
  id: string;
  equipmentId: string;
  status: EquipmentStatus;
  observations: string | null;
  changedBy: string;
  changedAt: Date;
}

// POST /api/equipments/status - Cambiar estado de un equipo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Validar datos de entrada
    const validatedData = changeStatusSchema.parse(body);

    // Obtener el equipo actual
    const equipment = await prisma.equipment.findUnique({
      where: { id: validatedData.equipmentId },
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
      },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipo no encontrado" },
        { status: 404 }
      );
    }

    // Verificar permisos según rol
    const userRole = session.user.role as "ADMINISTRADOR" | "TECNICO";

    // Si es técnico, verificar que está asignado al equipo
    if (userRole === "TECNICO" && equipment.assignedTechnicianId !== session.user.id) {
      return NextResponse.json(
        { error: "No estás asignado a este equipo" },
        { status: 403 }
      );
    }

    // Validar transición de estado
    const transitionResult = isValidStatusTransition(
      equipment.status,
      validatedData.newStatus,
      userRole
    );

    if (!transitionResult.valid) {
      return NextResponse.json(
        { error: transitionResult.message },
        { status: 400 }
      );
    }

    // Si el nuevo estado es REPAIR, se requiere asignar técnico
    if (validatedData.newStatus === "REPAIR") {
      if (!validatedData.assignedTechnicianId) {
        return NextResponse.json(
          { error: "Debe asignar un técnico para cambiar a REPAIR" },
          { status: 400 }
        );
      }

      // Verificar que el técnico existe y está activo
      const technician = await prisma.user.findFirst({
        where: {
          id: validatedData.assignedTechnicianId,
          role: "TECNICO",
          status: "ACTIVE",
        },
      });

      if (!technician) {
        return NextResponse.json(
          { error: "Técnico no encontrado o no disponible" },
          { status: 404 }
        );
      }
    }

    // Preparar datos de actualización
    type UpdateData = {
      status: "RECEIVED" | "REPAIR" | "REPAIRED" | "DELIVERED" | "CANCELLED";
      assignedTechnicianId?: string | null;
      deliveryDate?: Date;
    };

    const updateData: UpdateData = {
      status: validatedData.newStatus,
    };

    // Asignar técnico si se proporciona
    if (validatedData.assignedTechnicianId) {
      updateData.assignedTechnicianId = validatedData.assignedTechnicianId;
    }

    // Establecer fecha de entrega si el estado es DELIVERED
    if (validatedData.newStatus === "DELIVERED") {
      updateData.deliveryDate = new Date();
    }

    // Si se cambia a CANCELLED, verificar si hay adelanto y crear egreso de devolución
    if (validatedData.newStatus === "CANCELLED") {
      // Obtener el pago del equipo
      const payment = await prisma.payment.findFirst({
        where: { equipmentId: validatedData.equipmentId },
      });

      // Si hay adelanto, crear un egreso por devolución
      if (payment && payment.advanceAmount > 0) {
        await prisma.expense.create({
          data: {
            type: "OTHER",
            description: `Devolución de adelanto - Equipo ${equipment.code} cancelado`,
            amount: payment.advanceAmount,
            beneficiary: equipment.customer.name,
            paymentMethod: payment.paymentMethod,
            observations: `Cancelación de servicio. ${validatedData.observations || ""}`.trim(),
            createdBy: session.user.id,
          },
        });
      }
    }

    // Actualizar equipo
    const updatedEquipment = await prisma.equipment.update({
      where: { id: validatedData.equipmentId },
      data: updateData,
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
      },
    });

    // Crear entrada en historial de estados
    await prisma.equipmentStatusHistory.create({
      data: {
        equipmentId: validatedData.equipmentId,
        status: validatedData.newStatus,
        observations: validatedData.observations || null,
        changedBy: session.user.id,
      },
    });

    const formattedEquipment: Equipment = {
      id: updatedEquipment.id,
      code: updatedEquipment.code,
      type: updatedEquipment.type,
      brand: updatedEquipment.brand,
      model: updatedEquipment.model,
      serialNumber: updatedEquipment.serialNumber,
      reportedFlaw: updatedEquipment.reportedFlaw,
      accessories: updatedEquipment.accessories,
      serviceType: updatedEquipment.serviceType,
      others: updatedEquipment.others,
      status: updatedEquipment.status,
      entryDate: updatedEquipment.entryDate,
      deliveryDate: updatedEquipment.deliveryDate,
      createdAt: updatedEquipment.createdAt,
      updatedAt: updatedEquipment.updatedAt,
      customerId: updatedEquipment.customerId,
      assignedTechnicianId: updatedEquipment.assignedTechnicianId,
      customer: updatedEquipment.customer,
      assignedTechnician: updatedEquipment.assignedTechnician,
    };

    return NextResponse.json({
      equipment: formattedEquipment,
      message: "Estado actualizado exitosamente",
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

// GET /api/equipments/status - Obtener historial de estados de un equipo
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const equipmentId = searchParams.get("equipmentId");

    if (!equipmentId) {
      return NextResponse.json(
        { error: "Se requiere equipmentId" },
        { status: 400 }
      );
    }

    // Verificar que el equipo existe
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipo no encontrado" },
        { status: 404 }
      );
    }

    // Si es técnico, verificar acceso
    if (session.user.role === "TECNICO") {
      const hasAccess =
        equipment.assignedTechnicianId === session.user.id ||
        equipment.status === "RECEIVED";

      if (!hasAccess) {
        return NextResponse.json(
          { error: "No tienes acceso a este equipo" },
          { status: 403 }
        );
      }
    }

    // Obtener historial
    const history = await prisma.equipmentStatusHistory.findMany({
      where: { equipmentId },
      orderBy: { changedAt: "desc" },
    });

    // Obtener nombres de usuarios
    const typedHistory = history as PrismaHistoryEntry[];
    const userIds = [...new Set(typedHistory.map((h) => h.changedBy))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = new Map<string, { id: string; name: string }>(
      users.map((u: { id: string; name: string }) => [u.id, u])
    );

    const formattedHistory: EquipmentStatusHistoryItem[] = typedHistory.map((h) => ({
      id: h.id,
      status: h.status,
      observations: h.observations,
      changedBy: h.changedBy,
      changedAt: h.changedAt,
      changedByUser: userMap.get(h.changedBy),
    }));

    return NextResponse.json({ history: formattedHistory });
  } catch (error) {
    console.error("Error obteniendo historial:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
