// src/app/api/equipments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateEquipmentSchema } from "@/lib/validations/equipment";
import type { Equipment } from "@/types/equipment";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/equipments/[id] - Obtener un equipo específico
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

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
        statusHistory: {
          orderBy: { changedAt: "desc" },
          select: {
            id: true,
            status: true,
            observations: true,
            changedBy: true,
            changedAt: true,
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

    // Si es técnico, verificar que tenga acceso al equipo
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

    // Obtener nombres de usuarios que cambiaron estados
    interface StatusHistoryEntry {
      id: string;
      status: string;
      observations: string | null;
      changedBy: string;
      changedAt: Date;
    }
    const userIds = [...new Set(equipment.statusHistory.map((h: StatusHistoryEntry) => h.changedBy))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = new Map<string, { id: string; name: string }>(
      users.map((u: { id: string; name: string }) => [u.id, u])
    );

    const formattedEquipment: Equipment = {
      id: equipment.id,
      code: equipment.code,
      type: equipment.type,
      brand: equipment.brand,
      model: equipment.model,
      serialNumber: equipment.serialNumber,
      reportedFlaw: equipment.reportedFlaw,
      accessories: equipment.accessories,
      serviceType: equipment.serviceType,
      status: equipment.status,
      entryDate: equipment.entryDate,
      deliveryDate: equipment.deliveryDate,
      createdAt: equipment.createdAt,
      updatedAt: equipment.updatedAt,
      customerId: equipment.customerId,
      assignedTechnicianId: equipment.assignedTechnicianId,
      customer: equipment.customer,
      assignedTechnician: equipment.assignedTechnician,
      statusHistory: equipment.statusHistory.map((h: StatusHistoryEntry) => ({
        id: h.id,
        status: h.status,
        observations: h.observations,
        changedBy: h.changedBy,
        changedAt: h.changedAt,
        changedByUser: userMap.get(h.changedBy),
      })),
    };

    return NextResponse.json({ equipment: formattedEquipment });
  } catch (error) {
    console.error("Error obteniendo equipo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT /api/equipments/[id] - Actualizar equipo
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo administradores pueden actualizar equipos
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json(
        { error: "Permisos insuficientes" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Verificar que el equipo existe
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!existingEquipment) {
      return NextResponse.json(
        { error: "Equipo no encontrado" },
        { status: 404 }
      );
    }

    // Validar datos de entrada
    const validatedData = updateEquipmentSchema.parse(body);

    // Si se cambia el cliente, verificar que existe
    if (validatedData.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: validatedData.customerId },
      });

      if (!customer) {
        return NextResponse.json(
          { error: "Cliente no encontrado" },
          { status: 404 }
        );
      }
    }

    // Preparar datos para actualización
    type UpdateData = {
      type?: "PC" | "LAPTOP" | "PRINTER" | "PLOTTER" | "OTHER";
      brand?: string | null;
      model?: string | null;
      serialNumber?: string | null;
      reportedFlaw?: string;
      accessories?: string | null;
      serviceType?: string | null;
      customerId?: string;
      assignedTechnicianId?: string | null;
    };

    const updateData: UpdateData = {};

    if (validatedData.type) updateData.type = validatedData.type;
    if (validatedData.brand !== undefined)
      updateData.brand = validatedData.brand || null;
    if (validatedData.model !== undefined)
      updateData.model = validatedData.model || null;
    if (validatedData.serialNumber !== undefined)
      updateData.serialNumber = validatedData.serialNumber || null;
    if (validatedData.reportedFlaw)
      updateData.reportedFlaw = validatedData.reportedFlaw;
    if (validatedData.accessories !== undefined)
      updateData.accessories = validatedData.accessories || null;
    if (validatedData.serviceType !== undefined)
      updateData.serviceType = validatedData.serviceType || null;
    if (validatedData.customerId) updateData.customerId = validatedData.customerId;
    if (validatedData.assignedTechnicianId !== undefined)
      updateData.assignedTechnicianId = validatedData.assignedTechnicianId;

    // Actualizar equipo
    const equipment = await prisma.equipment.update({
      where: { id },
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

    const formattedEquipment: Equipment = {
      id: equipment.id,
      code: equipment.code,
      type: equipment.type,
      brand: equipment.brand,
      model: equipment.model,
      serialNumber: equipment.serialNumber,
      reportedFlaw: equipment.reportedFlaw,
      accessories: equipment.accessories,
      serviceType: equipment.serviceType,
      status: equipment.status,
      entryDate: equipment.entryDate,
      deliveryDate: equipment.deliveryDate,
      createdAt: equipment.createdAt,
      updatedAt: equipment.updatedAt,
      customerId: equipment.customerId,
      assignedTechnicianId: equipment.assignedTechnicianId,
      customer: equipment.customer,
      assignedTechnician: equipment.assignedTechnician,
    };

    return NextResponse.json({ equipment: formattedEquipment });
  } catch (error) {
    console.error("Error actualizando equipo:", error);

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

// DELETE /api/equipments/[id] - Eliminar equipo
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo administradores pueden eliminar equipos
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json(
        { error: "Permisos insuficientes" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verificar que el equipo existe
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        _count: {
          select: { payments: true },
        },
      },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipo no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si tiene pagos asociados
    if (equipment._count.payments > 0) {
      return NextResponse.json(
        {
          error: "No se puede eliminar el equipo",
          details: `El equipo tiene ${equipment._count.payments} pago(s) registrado(s)`,
        },
        { status: 400 }
      );
    }

    // Solo permitir eliminar equipos en estado RECEIVED o CANCELLED
    if (!["RECEIVED", "CANCELLED"].includes(equipment.status)) {
      return NextResponse.json(
        {
          error: "No se puede eliminar el equipo",
          details: "Solo se pueden eliminar equipos recibidos o cancelados",
        },
        { status: 400 }
      );
    }

    // Eliminar historial de estados primero
    await prisma.equipmentStatusHistory.deleteMany({
      where: { equipmentId: id },
    });

    // Eliminar equipo
    await prisma.equipment.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Equipo eliminado exitosamente",
      deletedId: id,
    });
  } catch (error) {
    console.error("Error eliminando equipo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
