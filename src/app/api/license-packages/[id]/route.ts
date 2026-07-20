// src/app/api/license-packages/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateLicensePackageSchema, getStockStatus } from "@/lib/validations/license";
import type { LicensePackage } from "@/types/license";

interface PrismaPackageResult {
  id: string;
  code: string;
  provider: string | null;
  totalLicenses: number;
  purchaseDate: Date;
  observations: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { activations: number };
}

function toLicensePackage(pkg: PrismaPackageResult): LicensePackage {
  const usedLicenses = pkg._count.activations;
  const remainingLicenses = pkg.totalLicenses - usedLicenses;
  return {
    id: pkg.id,
    code: pkg.code,
    provider: pkg.provider,
    totalLicenses: pkg.totalLicenses,
    usedLicenses,
    remainingLicenses,
    stockStatus: getStockStatus(remainingLicenses),
    purchaseDate: pkg.purchaseDate.toISOString(),
    observations: pkg.observations,
    createdBy: pkg.createdBy,
    createdAt: pkg.createdAt.toISOString(),
    updatedAt: pkg.updatedAt.toISOString(),
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

  const pkg = await prisma.licensePackage.findUnique({
    where: { id },
    include: {
      _count: { select: { activations: true } },
      activations: {
        orderBy: { activationDate: "desc" },
        include: {
          technician: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!pkg) {
    return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ package: toLicensePackage(pkg as PrismaPackageResult) });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateLicensePackageSchema.parse(body);

    const existing = await prisma.licensePackage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });
    }

    const updated = await prisma.licensePackage.update({
      where: { id },
      data: {
        ...(data.provider !== undefined ? { provider: data.provider || null } : {}),
        ...(data.totalLicenses !== undefined ? { totalLicenses: data.totalLicenses } : {}),
        ...(data.purchaseDate !== undefined ? { purchaseDate: new Date(data.purchaseDate) } : {}),
        ...(data.observations !== undefined ? { observations: data.observations || null } : {}),
      },
      include: { _count: { select: { activations: true } } },
    });

    return NextResponse.json({ package: toLicensePackage(updated as PrismaPackageResult) });
  } catch (error) {
    console.error("Error actualizando paquete:", error);
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

  const pkg = await prisma.licensePackage.findUnique({
    where: { id },
    include: { _count: { select: { activations: true } } },
  });
  if (!pkg) {
    return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });
  }
  if (pkg._count.activations > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar un paquete con activaciones registradas", details: "Elimine primero las activaciones asociadas." },
      { status: 400 }
    );
  }

  await prisma.licensePackage.delete({ where: { id } });
  return NextResponse.json({ message: "Paquete eliminado", deletedId: id });
}
