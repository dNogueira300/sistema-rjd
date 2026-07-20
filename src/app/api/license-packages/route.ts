// src/app/api/license-packages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLicensePackageSchema, getStockStatus } from "@/lib/validations/license";
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

// Genera un código LIC-YYYYMMDD-NNNN correlativo por día
async function generateLicensePackageCode(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const datePart = `${year}${month}${day}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const last = await prisma.licensePackage.findFirst({
    where: { createdAt: { gte: today, lt: tomorrow } },
    orderBy: { code: "desc" },
    select: { code: true },
  });

  let next = 1;
  if (last?.code) {
    const lastSeq = parseInt(last.code.split("-")[2] ?? "0", 10);
    if (!Number.isNaN(lastSeq)) next = lastSeq + 1;
  }

  return `LIC-${datePart}-${String(next).padStart(4, "0")}`;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }

    const packages = await prisma.licensePackage.findMany({
      orderBy: { purchaseDate: "desc" },
      include: { _count: { select: { activations: true } } },
    });

    const formatted = (packages as PrismaPackageResult[]).map(toLicensePackage);

    return NextResponse.json({ packages: formatted, total: formatted.length });
  } catch (error) {
    console.error("Error obteniendo paquetes de licencias:", error);
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
    const data = createLicensePackageSchema.parse(body);

    const code = await generateLicensePackageCode();

    const created = await prisma.licensePackage.create({
      data: {
        code,
        provider: data.provider ? data.provider : null,
        totalLicenses: data.totalLicenses,
        purchaseDate: new Date(data.purchaseDate),
        observations: data.observations ? data.observations : null,
        createdBy: session.user.id,
      },
      include: { _count: { select: { activations: true } } },
    });

    return NextResponse.json(
      { package: toLicensePackage(created as PrismaPackageResult) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando paquete de licencias:", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
