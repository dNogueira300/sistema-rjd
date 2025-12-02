// src/app/api/reports/operational/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calculateOperationalMetrics,
  calculateEquipmentsByStatus,
  calculateEquipmentsByType,
  calculateRepairTimes,
  getDaysBetween,
} from "@/lib/reports";
import type {
  OperationalReportResponse,
  TechnicianPerformance,
  OverdueEquipment,
  ReportFilters,
} from "@/types/reports";

// GET /api/reports/operational - Reporte operativo completo
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parsear filtros
    const filters: ReportFilters = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      technicianId: searchParams.get("technicianId") || undefined,
      equipmentType:
        (searchParams.get("equipmentType") as ReportFilters["equipmentType"]) ||
        "ALL",
      status: (searchParams.get("status") as ReportFilters["status"]) || "ALL",
    };

    // Construir where condition
    type WhereCondition = {
      entryDate?: { gte?: Date; lte?: Date };
      assignedTechnicianId?: string;
      type?: "PC" | "LAPTOP" | "PRINTER" | "PLOTTER" | "OTHER";
      status?: "RECEIVED" | "REPAIR" | "REPAIRED" | "DELIVERED" | "CANCELLED";
    };

    const where: WhereCondition = {};

    // Filtro de fechas
    if (filters.startDate || filters.endDate) {
      where.entryDate = {};
      if (filters.startDate) {
        where.entryDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.entryDate.lte = endDate;
      }
    }

    // Filtro de técnico
    if (filters.technicianId) {
      where.assignedTechnicianId = filters.technicianId;
    }

    // Filtro de tipo
    if (filters.equipmentType && filters.equipmentType !== "ALL") {
      where.type = filters.equipmentType as WhereCondition["type"];
    }

    // Filtro de estado
    if (filters.status && filters.status !== "ALL") {
      where.status = filters.status as WhereCondition["status"];
    }

    // Obtener equipos con select optimizado
    const equipments = await prisma.equipment.findMany({
      where,
      select: {
        id: true,
        code: true,
        type: true,
        status: true,
        entryDate: true,
        deliveryDate: true,
        assignedTechnicianId: true,
        assignedTechnician: {
          select: {
            id: true,
            name: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: {
          select: {
            totalAmount: true,
            advanceAmount: true,
          },
        },
      },
      orderBy: {
        entryDate: "desc",
      },
    });

    // Calcular métricas operativas
    const metrics = calculateOperationalMetrics(equipments);
    const equipmentsByStatus = calculateEquipmentsByStatus(equipments);
    const equipmentsByType = calculateEquipmentsByType(equipments);
    const repairTimes = calculateRepairTimes(equipments);

    // Calcular rendimiento por técnico
    const technicianMap = new Map<string, TechnicianPerformance>();

    equipments.forEach((eq) => {
      if (eq.assignedTechnician) {
        const techId = eq.assignedTechnician.id;

        if (!technicianMap.has(techId)) {
          technicianMap.set(techId, {
            technicianId: techId,
            technicianName: eq.assignedTechnician.name,
            assignedCount: 0,
            completedCount: 0,
            averageDays: 0,
            revenue: 0,
          });
        }

        const perf = technicianMap.get(techId)!;
        perf.assignedCount++;

        if (eq.status === "DELIVERED" && eq.deliveryDate) {
          perf.completedCount++;

          // Calcular revenue (usar advanceAmount o totalAmount)
          const revenue = eq.payments.reduce(
            (
              sum: number,
              p: { totalAmount: number; advanceAmount: number }
            ) => {
              const amount =
                p.advanceAmount < p.totalAmount
                  ? p.advanceAmount
                  : p.totalAmount;
              return sum + amount;
            },
            0
          );
          perf.revenue += revenue;
        }
      }
    });

    // Calcular días promedio por técnico
    const technicianPerformance: TechnicianPerformance[] = Array.from(
      technicianMap.values()
    ).map((perf) => {
      // Obtener equipos completados de este técnico
      const completedEquipments = equipments.filter(
        (eq) =>
          eq.assignedTechnicianId === perf.technicianId &&
          eq.status === "DELIVERED" &&
          eq.deliveryDate
      );

      if (completedEquipments.length > 0) {
        const totalDays = completedEquipments.reduce((sum: number, eq) => {
          return sum + getDaysBetween(eq.entryDate, eq.deliveryDate!);
        }, 0);
        perf.averageDays =
          Math.round((totalDays / completedEquipments.length) * 10) / 10;
      }

      return perf;
    });

    // Ordenar por equipos completados (descendente)
    technicianPerformance.sort((a, b) => b.completedCount - a.completedCount);

    // Encontrar equipos vencidos (>14 días en REPAIR)
    const now = new Date();
    const overdueEquipments: OverdueEquipment[] = equipments
      .filter((eq) => eq.status === "REPAIR")
      .map((eq) => ({
        id: eq.id,
        code: eq.code,
        customerName: eq.customer.name,
        technicianName: eq.assignedTechnician?.name || null,
        daysInRepair: getDaysBetween(eq.entryDate, now),
        entryDate: eq.entryDate,
        type: eq.type,
        status: eq.status,
      }))
      .filter((eq) => eq.daysInRepair > 14)
      .sort((a, b) => b.daysInRepair - a.daysInRepair);

    const response: OperationalReportResponse = {
      metrics,
      equipmentsByStatus,
      equipmentsByType,
      technicianPerformance,
      repairTimes,
      overdueEquipments,
      filters,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generando reporte operativo:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
