// src/app/api/tecnicos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  createTechnicianSchema,
  technicianFiltersSchema,
} from "@/lib/validations/technician";
import type { Technician } from "@/types/technician";

// GET /api/tecnicos - Obtener lista de técnicos con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo administradores pueden gestionar técnicos
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json(
        { error: "Permisos insuficientes" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Validar parámetros de consulta
    const params = technicianFiltersSchema.parse({
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || "ALL",
      sortBy: searchParams.get("sortBy") || "name",
      sortOrder: searchParams.get("sortOrder") || "asc",
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 20,
    });

    const { search, status, sortBy, sortOrder, page, limit } = params;
    const skip = (page - 1) * limit;

    // Construir condiciones de filtro - solo técnicos
    const where: Record<string, unknown> = {
      role: "TECNICO",
    };

    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        { phone: { contains: searchTerm } },
      ];
    }

    if (status !== "ALL") {
      where.status = status;
    }

    // Construir ordenamiento
    const orderBy: Record<string, unknown> = { [sortBy]: sortOrder };

    // Obtener técnicos con conteo de equipos asignados
    const [technicians, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
      }),
      prisma.user.count({ where }),
    ]);

    // Formatear respuesta
    const formattedTechnicians: Technician[] = technicians.map((tech) => ({
      id: tech.id,
      name: tech.name,
      email: tech.email,
      phone: tech.phone,
      status: tech.status as "ACTIVE" | "INACTIVE",
      equipmentCount: tech._count.assignedEquipments,
      createdAt: tech.createdAt,
      updatedAt: tech.updatedAt,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      technicians: formattedTechnicians,
      total,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });
  } catch (error) {
    console.error("Error obteniendo técnicos:", error);

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

// POST /api/tecnicos - Crear nuevo técnico
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
    const validatedData = createTechnicianSchema.parse(body);

    // Verificar si ya existe un usuario con el mismo email
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este email" },
        { status: 400 }
      );
    }

    // Hash de la contraseña temporal
    const hashedPassword = await bcrypt.hash("temp123", 12);

    // Crear técnico
    const technician = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        password: hashedPassword,
        role: "TECNICO",
        status: "ACTIVE",
      },
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
      id: technician.id,
      name: technician.name,
      email: technician.email,
      phone: technician.phone,
      status: technician.status as "ACTIVE" | "INACTIVE",
      equipmentCount: technician._count.assignedEquipments,
      createdAt: technician.createdAt,
      updatedAt: technician.updatedAt,
    };

    return NextResponse.json(
      { technician: formattedTechnician },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando técnico:", error);

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
