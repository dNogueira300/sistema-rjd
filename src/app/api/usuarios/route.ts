// src/app/api/usuarios/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createUserSchema, userFiltersSchema } from "@/lib/validations/user";
import {
  requireAdmin,
  toSystemUser,
  userSelect,
  handleRouteError,
} from "@/lib/users";
import type { UserStats } from "@/types/user";

// GET /api/usuarios - Listado de usuarios con filtros y estadísticas
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const { search, role, status, sortBy, sortOrder, page, limit } =
      userFiltersSchema.parse({
        search: searchParams.get("search") || "",
        role: searchParams.get("role") || "ALL",
        status: searchParams.get("status") || "ALL",
        sortBy: searchParams.get("sortBy") || "name",
        sortOrder: searchParams.get("sortOrder") || "asc",
        page: Number(searchParams.get("page")) || 1,
        limit: Number(searchParams.get("limit")) || 20,
      });

    const where: Record<string, unknown> = {};
    if (search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { phone: { contains: term } },
      ];
    }
    if (role !== "ALL") where.role = role;
    if (status !== "ALL") where.status = status;

    const [users, total, grouped] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        select: userSelect,
      }),
      prisma.user.count({ where }),
      // Estadísticas globales (no dependen de los filtros)
      prisma.user.groupBy({
        by: ["role", "status"],
        _count: { _all: true },
      }),
    ]);

    const stats: UserStats = {
      total: 0,
      admins: 0,
      technicians: 0,
      active: 0,
      inactive: 0,
    };
    for (const g of grouped) {
      const n = g._count._all;
      stats.total += n;
      if (g.role === "ADMINISTRADOR") stats.admins += n;
      else stats.technicians += n;
      if (g.status === "ACTIVE") stats.active += n;
      else stats.inactive += n;
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      users: users.map(toSystemUser),
      total,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      stats,
    });
  } catch (error) {
    return handleRouteError(error, "obteniendo usuarios");
  }
}

// POST /api/usuarios - Crear usuario (administrador o técnico)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const data = createUserSchema.parse(await request.json());

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este email" },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        role: data.role,
        status: "ACTIVE",
        password: await bcrypt.hash(data.password, 12),
      },
      select: userSelect,
    });

    return NextResponse.json({ user: toSystemUser(user) }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "creando usuario");
  }
}
