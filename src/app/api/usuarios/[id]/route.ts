// src/app/api/usuarios/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { updateUserSchema } from "@/lib/validations/user";
import {
  requireAdmin,
  toSystemUser,
  userSelect,
  handleRouteError,
} from "@/lib/users";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ¿Quedaría al menos un administrador activo si se excluye a este usuario?
async function hasOtherActiveAdmin(excludeId: string) {
  const count = await prisma.user.count({
    where: { role: "ADMINISTRADOR", status: "ACTIVE", id: { not: excludeId } },
  });
  return count > 0;
}

// PUT /api/usuarios/[id] - Editar datos, rol, estado o restablecer contraseña
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const { id } = await params;

    const body = await request.json();
    const data = updateUserSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, status: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const isSelf = id === auth.session.user.id;
    const losesAdmin =
      existing.role === "ADMINISTRADOR" &&
      ((data.role && data.role !== "ADMINISTRADOR") ||
        data.status === "INACTIVE");

    if (isSelf && losesAdmin) {
      return NextResponse.json(
        {
          error:
            "No puedes quitarte el rol de administrador ni desactivar tu propia cuenta",
        },
        { status: 400 }
      );
    }
    if (losesAdmin && !(await hasOtherActiveAdmin(id))) {
      return NextResponse.json(
        { error: "Debe quedar al menos un administrador activo en el sistema" },
        { status: 400 }
      );
    }

    if (data.email && data.email !== existing.email) {
      const duplicate = await prisma.user.findUnique({
        where: { email: data.email },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Ya existe otro usuario con este email" },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if ("phone" in body) updateData.phone = data.phone || null;
    if (data.role) updateData.role = data.role;
    if (data.status) updateData.status = data.status;
    if (data.password) updateData.password = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelect,
    });

    return NextResponse.json({ user: toSystemUser(user) });
  } catch (error) {
    return handleRouteError(error, "actualizando usuario");
  }
}

// DELETE /api/usuarios/[id] - Eliminar usuario sin historial asociado
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const { id } = await params;

    if (id === auth.session.user.id) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        role: true,
        status: true,
        _count: {
          select: {
            assignedEquipments: true,
            licenseActivations: true,
            payrollRecords: true,
            advances: true,
          },
        },
      },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (
      user.role === "ADMINISTRADOR" &&
      user.status === "ACTIVE" &&
      !(await hasOtherActiveAdmin(id))
    ) {
      return NextResponse.json(
        { error: "Debe quedar al menos un administrador activo en el sistema" },
        { status: 400 }
      );
    }

    const c = user._count;
    const related =
      c.assignedEquipments + c.licenseActivations + c.payrollRecords + c.advances;
    if (related > 0) {
      return NextResponse.json(
        {
          error: "No se puede eliminar el usuario",
          details:
            "Tiene historial asociado (equipos, licencias o pagos). Desactívalo en su lugar para conservar el historial.",
        },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      message: "Usuario eliminado exitosamente",
      deletedId: id,
    });
  } catch (error) {
    return handleRouteError(error, "eliminando usuario");
  }
}
