// src/app/api/license-activations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createLicenseActivationSchema,
  licenseActivationFiltersSchema,
} from "@/lib/validations/license";
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

const activationInclude = {
  package: { select: { id: true, code: true } },
  technician: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true } },
} as const;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filters = licenseActivationFiltersSchema.parse({
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      technicianId: searchParams.get("technicianId") || undefined,
      customerId: searchParams.get("customerId") || undefined,
      packageId: searchParams.get("packageId") || undefined,
    });

    const where: Record<string, unknown> = {};
    if (filters.from || filters.to) {
      const dateFilter: Record<string, Date> = {};
      if (filters.from) dateFilter.gte = new Date(filters.from);
      if (filters.to) dateFilter.lte = new Date(filters.to);
      where.activationDate = dateFilter;
    }
    if (filters.technicianId) where.technicianId = filters.technicianId;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.packageId) where.packageId = filters.packageId;

    const activations = await prisma.licenseActivation.findMany({
      where,
      orderBy: { activationDate: "desc" },
      include: activationInclude,
    });

    const formatted = (activations as PrismaActivationResult[]).map(toActivation);
    return NextResponse.json({ activations: formatted, total: formatted.length });
  } catch (error) {
    console.error("Error obteniendo activaciones:", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }

    const body = await request.json();
    const data = createLicenseActivationSchema.parse(body);

    // Verificar que el paquete existe y tiene stock disponible
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
        { error: "El paquete no tiene licencias disponibles", details: "Registre un nuevo paquete." },
        { status: 400 }
      );
    }

    // Verificar existencia de técnico y cliente
    const [technician, customer] = await Promise.all([
      prisma.user.findUnique({ where: { id: data.technicianId }, select: { id: true } }),
      prisma.customer.findUnique({ where: { id: data.customerId }, select: { id: true } }),
    ]);
    if (!technician) {
      return NextResponse.json({ error: "Técnico no encontrado" }, { status: 404 });
    }
    if (!customer) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const created = await prisma.licenseActivation.create({
      data: {
        packageId: data.packageId,
        activationDate: new Date(data.activationDate),
        technicianId: data.technicianId,
        licenseKey: data.licenseKey,
        support: data.support,
        customerId: data.customerId,
        observations: data.observations ? data.observations : null,
        createdBy: session.user.id,
      },
      include: activationInclude,
    });

    return NextResponse.json(
      { activation: toActivation(created as PrismaActivationResult) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando activación:", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
