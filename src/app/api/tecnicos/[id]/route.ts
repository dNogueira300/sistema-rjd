// src/app/api/tecnicos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTechnicianSchema } from "@/lib/validations/technician";
import type { Technician } from "@/types/technician";

interface RouteContext {
  params: Promise<{ id: string }>; // Promise en Next.js 15
}

// GET /api/tecnicos/[id] - Obtener técnico específico
export async function GET(request: NextRequest, { params }: RouteContext) {
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

    // Await params en Next.js 15
    const { id } = await params;

    const technician = await prisma.user.findFirst({
      where: { id, role: "TECNICO" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { assignedEquipments: true },
        },
        assignedEquipments: {
          select: {
            id: true,
            code: true,
            type: true,
            status: true,
            entryDate: true,
          },
          orderBy: { entryDate: "desc" },
          take: 5,
        },
      },
    });

    if (!technician) {
      return NextResponse.json(
        { error: "Técnico no encontrado" },
        { status: 404 }
      );
    }

    const formattedTechnician: Technician & { equipments?: unknown[] } = {
      id: technician.id,
      name: technician.name,
      email: technician.email,
      phone: technician.phone,
      status: technician.status as "ACTIVE" | "INACTIVE",
      equipmentCount: technician._count.assignedEquipments,
      createdAt: technician.createdAt,
      updatedAt: technician.updatedAt,
    };

    return NextResponse.json({
      technician: formattedTechnician,
      equipments: technician.assignedEquipments,
    });
  } catch (error) {
    console.error("Error obteniendo técnico:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT /api/tecnicos/[id] - Actualizar técnico
export async function PUT(request: NextRequest, { params }: RouteContext) {
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

    const body = await request.json();

    // Validar datos de entrada
    const validatedData = updateTechnicianSchema.parse(body);

    // Await params en Next.js 15
    const { id } = await params;

    // Verificar que el técnico existe
    const existingTechnician = await prisma.user.findFirst({
      where: { id, role: "TECNICO" },
    });

    if (!existingTechnician) {
      return NextResponse.json(
        { error: "Técnico no encontrado" },
        { status: 404 }
      );
    }

    // Verificar duplicados de email solo si se está actualizando
    if (validatedData.email && validatedData.email !== existingTechnician.email) {
      const duplicateEmail = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (duplicateEmail) {
        return NextResponse.json(
          { error: "Ya existe otro usuario con este email" },
          { status: 400 }
        );
      }
    }

    // Actualizar técnico - solo actualizar campos que vienen en el body
    const updateData: Record<string, unknown> = {};

    if (validatedData.name) {
      updateData.name = validatedData.name;
    }
    if (validatedData.email) {
      updateData.email = validatedData.email;
    }
    // Solo actualizar phone si viene explícitamente en el body original
    if ("phone" in body) {
      updateData.phone = validatedData.phone || null;
    }
    if (validatedData.status) {
      updateData.status = validatedData.status;
    }

    const updatedTechnician = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { assignedEquipments: true },
        },
      },
    });

    // Formatear respuesta
    const formattedTechnician: Technician = {
      id: updatedTechnician.id,
      name: updatedTechnician.name,
      email: updatedTechnician.email,
      phone: updatedTechnician.phone,
      status: updatedTechnician.status as "ACTIVE" | "INACTIVE",
      equipmentCount: updatedTechnician._count.assignedEquipments,
      createdAt: updatedTechnician.createdAt,
      updatedAt: updatedTechnician.updatedAt,
    };

    return NextResponse.json({ technician: formattedTechnician });
  } catch (error) {
    console.error("Error actualizando técnico:", error);

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

// DELETE /api/tecnicos/[id] - Eliminar técnico
export async function DELETE(request: NextRequest, { params }: RouteContext) {
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

    // Await params en Next.js 15
    const { id } = await params;

    // Verificar que el técnico existe
    const existingTechnician = await prisma.user.findFirst({
      where: { id, role: "TECNICO" },
      include: {
        _count: {
          select: { assignedEquipments: true },
        },
      },
    });

    if (!existingTechnician) {
      return NextResponse.json(
        { error: "Técnico no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si el técnico tiene equipos asignados
    if (existingTechnician._count.assignedEquipments > 0) {
      return NextResponse.json(
        {
          error: "No se puede eliminar el técnico",
          details: `El técnico tiene ${existingTechnician._count.assignedEquipments} equipo(s) asignado(s). Reasigne los equipos primero.`,
        },
        { status: 400 }
      );
    }

    // Eliminar técnico
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Técnico eliminado exitosamente",
      deletedId: id,
    });
  } catch (error) {
    console.error("Error eliminando técnico:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
