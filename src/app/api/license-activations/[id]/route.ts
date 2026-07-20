// src/app/api/license-activations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateLicenseActivationSchema } from "@/lib/validations/license";
import type { LicenseActivation } from "@/types/license";

interface PrismaActivationResult {
  id: string;
  activationDate: Date;
  licenseKey: string;
  support: string;
  observations: string | null;
  packageId: string;
  technicianId: string;
  customerId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  package: { id: string; code: string };
  technician: { id: string; name: string };
  customer: { id: string; name: string };
}

const activationInclude = {
  package: { select: { id: true, code: true } },
  technician: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true } },
} as const;

function toActivation(a: PrismaActivationResult): LicenseActivation {
  return {
    id: a.id,
    activationDate: a.activationDate.toISOString(),
    licenseKey: a.licenseKey,
    support: a.support,
    observations: a.observations,
    packageId: a.packageId,
    technicianId: a.technicianId,
    customerId: a.customerId,
    package: { id: a.package.id, code: a.package.code },
    technician: { id: a.technician.id, name: a.technician.name },
    customer: { id: a.customer.id, name: a.customer.name },
    createdBy: a.createdBy,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  if (session.user.role !== "ADMINISTRADOR") {
    return { error: NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 }) };
  }
  return { session };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;

  try {
    const activation = await prisma.licenseActivation.findUnique({
      where: { id },
      include: activationInclude,
    });
    if (!activation) {
      return NextResponse.json({ error: "Activación no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ activation: toActivation(activation as PrismaActivationResult) });
  } catch (error) {
    console.error("Error obteniendo activación:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateLicenseActivationSchema.parse(body);

    const existing = await prisma.licenseActivation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Activación no encontrada" }, { status: 404 });
    }

    if (data.technicianId && data.technicianId !== existing.technicianId) {
      const technician = await prisma.user.findUnique({ where: { id: data.technicianId }, select: { id: true } });
      if (!technician) {
        return NextResponse.json({ error: "Técnico no encontrado" }, { status: 404 });
      }
    }
    if (data.customerId && data.customerId !== existing.customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: data.customerId }, select: { id: true } });
      if (!customer) {
        return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
      }
    }
    if (data.packageId && data.packageId !== existing.packageId) {
      const pkg = await prisma.licensePackage.findUnique({
        where: { id: data.packageId },
        include: { _count: { select: { activations: true } } },
      });
      if (!pkg) {
        return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });
      }
      const remaining = pkg.totalLicenses - pkg._count.activations;
      if (remaining <= 0) {
        return NextResponse.json(
          { error: "El paquete destino no tiene licencias disponibles", details: "Elija otro paquete." },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.licenseActivation.update({
      where: { id },
      data: {
        ...(data.packageId !== undefined ? { packageId: data.packageId } : {}),
        ...(data.activationDate !== undefined ? { activationDate: new Date(data.activationDate) } : {}),
        ...(data.technicianId !== undefined ? { technicianId: data.technicianId } : {}),
        ...(data.licenseKey !== undefined ? { licenseKey: data.licenseKey } : {}),
        ...(data.support !== undefined ? { support: data.support } : {}),
        ...(data.customerId !== undefined ? { customerId: data.customerId } : {}),
        ...(data.observations !== undefined ? { observations: data.observations || null } : {}),
      },
      include: activationInclude,
    });

    return NextResponse.json({ activation: toActivation(updated as PrismaActivationResult) });
  } catch (error) {
    console.error("Error actualizando activación:", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;

  try {
    const existing = await prisma.licenseActivation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Activación no encontrada" }, { status: 404 });
    }

    await prisma.licenseActivation.delete({ where: { id } });
    return NextResponse.json({ message: "Activación eliminada", deletedId: id });
  } catch (error) {
    console.error("Error eliminando activación:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
