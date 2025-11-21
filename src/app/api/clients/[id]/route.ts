// src/app/api/clients/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateClientSchema } from "@/lib/validations/client";
import type { Client } from "@/types/client";

interface RouteContext {
  params: Promise<{ id: string }>; // Promise en Next.js 15
}

// GET /api/clients/[id] - Obtener cliente específico
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

    const client = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { equipments: true },
        },
        equipments: {
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

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    const formattedClient: Client & { equipments?: unknown[] } = {
      id: client.id,
      name: client.name,
      phone: client.phone,
      ruc: client.ruc,
      status: "ACTIVE",
      equipmentCount: client._count.equipments,
      lastVisit: client.equipments[0]?.entryDate?.toISOString().split("T")[0],
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      equipments: client.equipments,
    };

    return NextResponse.json({ client: formattedClient });
  } catch (error) {
    console.error("Error obteniendo cliente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Actualizar cliente
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
    const validatedData = updateClientSchema.parse(body);

    // Await params en Next.js 15
    const { id } = await params;

    // Verificar que el cliente exists
    const existingClient = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Verificar duplicados solo si se están actualizando campos únicos
    if (validatedData.phone || validatedData.ruc) {
      const duplicateWhere: Record<string, unknown> = {
        id: { not: id },
      };

      const orConditions: Record<string, unknown>[] = [];

      if (validatedData.phone) {
        orConditions.push({ phone: validatedData.phone });
      }

      if (validatedData.ruc) {
        orConditions.push({ ruc: validatedData.ruc });
      }

      if (orConditions.length > 0) {
        duplicateWhere.OR = orConditions;
      }

      const duplicateClient = await prisma.customer.findFirst({
        where: duplicateWhere,
      });

      if (duplicateClient) {
        let duplicateField = "campo";
        if (duplicateClient.phone === validatedData.phone)
          duplicateField = "teléfono";
        else if (duplicateClient.ruc === validatedData.ruc)
          duplicateField = "RUC";

        return NextResponse.json(
          { error: `Ya existe otro cliente con este ${duplicateField}` },
          { status: 400 }
        );
      }
    }

    // Actualizar cliente
    const updatedClient = await prisma.customer.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.phone && { phone: validatedData.phone }),
        ...(validatedData.ruc !== undefined && {
          ruc: validatedData.ruc || null,
        }),
      },
      include: {
        _count: {
          select: { equipments: true },
        },
      },
    });

    // Formatear respuesta
    const formattedClient: Client = {
      id: updatedClient.id,
      name: updatedClient.name,
      phone: updatedClient.phone,
      ruc: updatedClient.ruc,
      status: "ACTIVE",
      equipmentCount: updatedClient._count.equipments,
      lastVisit: undefined,
      createdAt: updatedClient.createdAt,
      updatedAt: updatedClient.updatedAt,
    };

    return NextResponse.json({ client: formattedClient });
  } catch (error) {
    console.error("Error actualizando cliente:", error);

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

// DELETE /api/clients/[id] - Eliminar cliente
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

    // Verificar que el cliente exists
    const existingClient = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { equipments: true },
        },
      },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si el cliente tiene equipos asociados
    if (existingClient._count.equipments > 0) {
      return NextResponse.json(
        {
          error: "No se puede eliminar el cliente",
          details: `El cliente tiene ${existingClient._count.equipments} equipo(s) asociado(s). Elimine o reasigne los equipos primero.`,
        },
        { status: 400 }
      );
    }

    // Eliminar cliente
    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Cliente eliminado exitosamente",
      deletedId: id,
    });
  } catch (error) {
    console.error("Error eliminando cliente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
