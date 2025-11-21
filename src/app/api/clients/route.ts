// src/app/api/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createClientSchema,
  clientFiltersSchema,
} from "@/lib/validations/client";
import type { Client } from "@/types/client";

// GET /api/clients - Obtener lista de clientes con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo administradores pueden gestionar clientes
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json(
        { error: "Permisos insuficientes" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Validar parámetros de consulta
    const params = clientFiltersSchema.parse({
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || "ALL",
      sortBy: searchParams.get("sortBy") || "name",
      sortOrder: searchParams.get("sortOrder") || "asc",
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 20,
    });

    const { search, status, sortBy, sortOrder, page, limit } = params;
    const skip = (page - 1) * limit;

    // Construir condiciones de filtro
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search.replace(/\D/g, "") } },
        { ruc: { contains: search.replace(/\D/g, "") } },
      ];
    }

    if (status !== "ALL") {
      // Por ahora todos los clientes son ACTIVE (agregar campo status al schema si es necesario)
      // where.status = status;
    }

    // Construir ordenamiento - CORREGIDO
    let orderBy: Record<string, unknown>;
    if (sortBy === "lastVisit") {
      // Para lastVisit, ordenamos por la fecha del equipo más reciente
      // Nota: Esto es complejo con Prisma, por ahora usamos createdAt
      orderBy = { createdAt: sortOrder };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Obtener clientes con conteo de equipos
    const [clients, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: { equipments: true },
          },
          equipments: {
            select: { entryDate: true },
            orderBy: { entryDate: "desc" },
            take: 1,
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    // Formatear respuesta
    const formattedClients: Client[] = clients.map((client) => ({
      id: client.id,
      name: client.name,
      phone: client.phone,
      ruc: client.ruc,
      status: "ACTIVE" as const, // Por defecto ACTIVE hasta agregar campo al schema
      equipmentCount: client._count.equipments,
      lastVisit: client.equipments[0]?.entryDate?.toISOString().split("T")[0],
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      clients: formattedClients,
      total,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });
  } catch (error) {
    console.error("Error obteniendo clientes:", error);

    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json(
        { error: "Parámetros inválidos" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST /api/clients - Crear nuevo cliente
export async function POST(request: NextRequest) {
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
    const validatedData = createClientSchema.parse(body);

    // Verificar si ya existe un cliente con el mismo teléfono
    const existingClient = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone: validatedData.phone },
          ...(validatedData.ruc ? [{ ruc: validatedData.ruc }] : []),
        ],
      },
    });

    if (existingClient) {
      const duplicateField =
        existingClient.phone === validatedData.phone ? "teléfono" : "RUC";
      return NextResponse.json(
        { error: `Ya existe un cliente con este ${duplicateField}` },
        { status: 400 }
      );
    }

    // Crear cliente
    const client = await prisma.customer.create({
      data: {
        name: validatedData.name,
        phone: validatedData.phone,
        ruc: validatedData.ruc || null,
      },
      include: {
        _count: {
          select: { equipments: true },
        },
      },
    });

    // Formatear respuesta
    const formattedClient: Client = {
      id: client.id,
      name: client.name,
      phone: client.phone,
      ruc: client.ruc,
      status: "ACTIVE",
      equipmentCount: client._count.equipments,
      lastVisit: undefined,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };

    return NextResponse.json({ client: formattedClient }, { status: 201 });
  } catch (error) {
    console.error("Error creando cliente:", error);

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
