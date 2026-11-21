// src/lib/users.ts
// Utilidades de servidor para el módulo de gestión de usuarios.
import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import type { SystemUser } from "@/types/user";

export const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: { assignedEquipments: true, licenseActivations: true },
  },
} as const;

interface SelectedUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { assignedEquipments: number; licenseActivations: number };
}

export function toSystemUser(u: SelectedUser): SystemUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role as SystemUser["role"],
    status: u.status as SystemUser["status"],
    equipmentCount: u._count.assignedEquipments,
    activationCount: u._count.licenseActivations,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

/**
 * Exige una sesión de ADMINISTRADOR. Devuelve la sesión o una respuesta de
 * error lista para retornar.
 */
export async function requireAdmin(): Promise<
  { session: Session; error?: never } | { session?: never; error: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }
  if (session.user.role !== "ADMINISTRADOR") {
    return {
      error: NextResponse.json(
        { error: "Permisos insuficientes" },
        { status: 403 }
      ),
    };
  }
  return { session };
}

export function handleRouteError(error: unknown, context: string) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Datos inválidos",
        details: error.issues.map((i) => i.message).join(". "),
      },
      { status: 400 }
    );
  }
  console.error(`Error ${context}:`, error);
  return NextResponse.json(
    { error: "Error interno del servidor" },
    { status: 500 }
  );
}
