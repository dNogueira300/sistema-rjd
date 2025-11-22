// src/app/api/equipments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createEquipmentSchema,
  equipmentFiltersSchema,
  generateEquipmentCode,
} from "@/lib/validations/equipment";
import type { Equipment, EquipmentType, EquipmentStatus } from "@/types/equipment";

// Tipo para el resultado de Prisma
interface PrismaEquipmentResult {
  id: string;
  code: string;
  type: EquipmentType;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  reportedFlaw: string;
  accessories: string | null;
  serviceType: string | null;
  status: EquipmentStatus;
  entryDate: Date;
  deliveryDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  customerId: string;
  assignedTechnicianId: string | null;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  assignedTechnician: {
    id: string;
    name: string;
    email: string;
  } | null;
}

// GET /api/equipments - Obtener lista de equipos con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Validar parámetros de consulta
    const params = equipmentFiltersSchema.parse({
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || "ALL",
      type: searchParams.get("type") || "ALL",
      sortBy: searchParams.get("sortBy") || "entryDate",
      sortOrder: searchParams.get("sortOrder") || "desc",
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 20,
    });

    const { search, status, type, sortBy, sortOrder, page, limit } = params;
    const skip = (page - 1) * limit;

    // Construir condiciones de filtro
    type WhereCondition = {
      OR?: Array<Record<string, unknown>>;
      status?: string;
      type?: string;
      assignedTechnicianId?: string;
    };

    const where: WhereCondition = {};

    // Si es técnico, solo mostrar sus equipos asignados o equipos RECEIVED
    if (session.user.role === "TECNICO") {
      where.OR = [
        { assignedTechnicianId: session.user.id },
        { status: "RECEIVED" },
      ];
    }

    if (search) {
      const searchTerm = search.trim();
      const searchConditions: Array<Record<string, unknown>> = [
        { code: { contains: searchTerm, mode: "insensitive" } },
        { brand: { contains: searchTerm, mode: "insensitive" } },
        { model: { contains: searchTerm, mode: "insensitive" } },
        { serialNumber: { contains: searchTerm, mode: "insensitive" } },
        { reportedFlaw: { contains: searchTerm, mode: "insensitive" } },
        { customer: { name: { contains: searchTerm, mode: "insensitive" } } },
        { customer: { phone: { contains: searchTerm } } },
      ];

      if (where.OR) {
        // Si ya tenemos OR por técnico, necesitamos AND con búsqueda
        where.OR = where.OR.map((condition) => ({
          ...condition,
          OR: searchConditions,
        }));
      } else {
        where.OR = searchConditions;
      }
    }

    // Filtrar por estado si no es ALL
    if (status !== "ALL") {
      where.status = status;
    }

    // Filtrar por tipo si no es ALL
    if (type !== "ALL") {
      where.type = type;
    }

    // Construir ordenamiento
    type OrderByType = Record<string, "asc" | "desc">;
    let orderBy: OrderByType;
    switch (sortBy) {
      case "code":
        orderBy = { code: sortOrder };
        break;
      case "status":
        orderBy = { status: sortOrder };
        break;
      case "type":
        orderBy = { type: sortOrder };
        break;
      case "entryDate":
      default:
        orderBy = { entryDate: sortOrder };
        break;
    }

    // Obtener equipos con relaciones
    const [equipments, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          assignedTechnician: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.equipment.count({ where }),
    ]);

    // Formatear respuesta
    const formattedEquipments: Equipment[] = (equipments as PrismaEquipmentResult[]).map((eq) => ({
      id: eq.id,
      code: eq.code,
      type: eq.type,
      brand: eq.brand,
      model: eq.model,
      serialNumber: eq.serialNumber,
      reportedFlaw: eq.reportedFlaw,
      accessories: eq.accessories,
      serviceType: eq.serviceType,
      status: eq.status,
      entryDate: eq.entryDate,
      deliveryDate: eq.deliveryDate,
      createdAt: eq.createdAt,
      updatedAt: eq.updatedAt,
      customerId: eq.customerId,
      assignedTechnicianId: eq.assignedTechnicianId,
      customer: eq.customer,
      assignedTechnician: eq.assignedTechnician,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      equipments: formattedEquipments,
      total,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });
  } catch (error) {
    console.error("Error obteniendo equipos:", error);

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

// POST /api/equipments - Crear nuevo equipo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo administradores pueden crear equipos
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json(
        { error: "Permisos insuficientes" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validar datos de entrada
    const validatedData = createEquipmentSchema.parse(body);

    // Verificar que el cliente existe
    const customer = await prisma.customer.findUnique({
      where: { id: validatedData.customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Generar código único
    const code = await generateEquipmentCode(async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const lastEquipment = await prisma.equipment.findFirst({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        orderBy: { code: "desc" },
        select: { code: true },
      });

      return lastEquipment?.code || null;
    });

    // Crear equipo
    const equipment = await prisma.equipment.create({
      data: {
        code,
        type: validatedData.type,
        brand: validatedData.brand || null,
        model: validatedData.model || null,
        serialNumber: validatedData.serialNumber || null,
        reportedFlaw: validatedData.reportedFlaw,
        accessories: validatedData.accessories || null,
        serviceType: validatedData.serviceType || null,
        status: "RECEIVED",
        customerId: validatedData.customerId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    // Crear entrada inicial en historial
    await prisma.equipmentStatusHistory.create({
      data: {
        equipmentId: equipment.id,
        status: "RECEIVED",
        observations: "Equipo recibido",
        changedBy: session.user.id,
      },
    });

    // Formatear respuesta
    const formattedEquipment: Equipment = {
      id: equipment.id,
      code: equipment.code,
      type: equipment.type,
      brand: equipment.brand,
      model: equipment.model,
      serialNumber: equipment.serialNumber,
      reportedFlaw: equipment.reportedFlaw,
      accessories: equipment.accessories,
      serviceType: equipment.serviceType,
      status: equipment.status,
      entryDate: equipment.entryDate,
      deliveryDate: equipment.deliveryDate,
      createdAt: equipment.createdAt,
      updatedAt: equipment.updatedAt,
      customerId: equipment.customerId,
      assignedTechnicianId: equipment.assignedTechnicianId,
      customer: equipment.customer,
    };

    return NextResponse.json({ equipment: formattedEquipment }, { status: 201 });
  } catch (error) {
    console.error("Error creando equipo:", error);

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
