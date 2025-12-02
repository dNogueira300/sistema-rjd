// src/hooks/useReports.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  OperationalReportResponse,
  FinancialReportResponse,
  ReportFilters,
  TechnicianPaymentsResponse,
  TechnicianPaymentsFilters,
} from "@/types/reports";

// ============ HOOKS PARA REPORTES OPERATIVOS ============

export function useOperationalReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ["operational-report", filters],
    queryFn: async (): Promise<OperationalReportResponse> => {
      const searchParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "ALL") {
          searchParams.append(key, String(value));
        }
      });

      const response = await apiFetch(
        `/api/reports/operational?${searchParams}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error obteniendo reporte operativo");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - reportes cambian menos frecuentemente
    gcTime: 10 * 60 * 1000, // 10 minutos en cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// ============ HOOKS PARA REPORTES FINANCIEROS ============

export function useFinancialReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ["financial-report", filters],
    queryFn: async (): Promise<FinancialReportResponse> => {
      const searchParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "ALL") {
          searchParams.append(key, String(value));
        }
      });

      const response = await apiFetch(
        `/api/reports/financial?${searchParams}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error obteniendo reporte financiero");
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutos - reducido para refrescar más frecuentemente
    gcTime: 5 * 60 * 1000, // 5 minutos en cache - reducido
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Cambiar a true para obtener datos frescos al montar
  });
}

// ============ HOOKS ESPECÍFICOS CON CACHE DIFERENCIADO ============

// KPIs financieros - cache más corto (actualizan frecuentemente)
export function useFinancialKPIs() {
  const { data, isLoading, error } = useFinancialReport({});

  return {
    kpis: data?.kpis,
    isLoading,
    error: error as Error | null,
  };
}

// Métricas operativas - cache medio
export function useOperationalMetrics(filters?: ReportFilters) {
  const { data, isLoading, error } = useOperationalReport(filters || {});

  return {
    metrics: data?.metrics,
    isLoading,
    error: error as Error | null,
  };
}

// Equipos por estado - cache más largo (menos volátil)
export function useEquipmentsByStatus(filters?: ReportFilters) {
  const { data, isLoading, error } = useOperationalReport(filters || {});

  return {
    equipmentsByStatus: data?.equipmentsByStatus,
    isLoading,
    error: error as Error | null,
  };
}

// Rendimiento de técnicos - cache medio
export function useTechnicianPerformance(filters?: ReportFilters) {
  const { data, isLoading, error } = useOperationalReport(filters || {});

  return {
    technicianPerformance: data?.technicianPerformance,
    isLoading,
    error: error as Error | null,
  };
}

// Tiempos de reparación - cache largo
export function useRepairTimes(filters?: ReportFilters) {
  const { data, isLoading, error } = useOperationalReport(filters || {});

  return {
    repairTimes: data?.repairTimes,
    isLoading,
    error: error as Error | null,
  };
}

// Equipos vencidos - cache corto (crítico)
export function useOverdueEquipments(filters?: ReportFilters) {
  return useQuery({
    queryKey: ["overdue-equipments", filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== "ALL") {
            searchParams.append(key, String(value));
          }
        });
      }

      const response = await apiFetch(
        `/api/reports/operational?${searchParams}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error obteniendo equipos vencidos");
      }

      const data: OperationalReportResponse = await response.json();
      return data.overdueEquipments;
    },
    staleTime: 1 * 60 * 1000, // 1 minuto - crítico, actualizar frecuentemente
    gcTime: 5 * 60 * 1000, // 5 minutos en cache
    refetchOnWindowFocus: true, // Refetch al volver a la ventana
  });
}

// Alertas - cache muy corto (crítico)
export function useAlerts() {
  const { data, isLoading, error, refetch } = useFinancialReport({});

  return {
    alerts: data?.alerts || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// Gráfico de ingresos diarios - cache medio
export function useDailyRevenue(filters?: ReportFilters) {
  const { data, isLoading, error } = useFinancialReport(filters || {});

  return {
    dailyRevenue: data?.dailyRevenue,
    isLoading,
    error: error as Error | null,
  };
}

// Top técnicos - cache medio
export function useTopTechnicians(filters?: ReportFilters) {
  const { data, isLoading, error } = useFinancialReport(filters || {});

  return {
    topTechnicians: data?.topTechnicians,
    isLoading,
    error: error as Error | null,
  };
}

// Análisis de rentabilidad - cache medio
export function useRevenueAnalysis(filters?: ReportFilters) {
  const { data, isLoading, error } = useFinancialReport(filters || {});

  return {
    revenueAnalysis: data?.revenueAnalysis,
    isLoading,
    error: error as Error | null,
  };
}

// ============ HOOKS PARA PAGOS A TÉCNICOS ============

export function useTechnicianPayments(filters: TechnicianPaymentsFilters = {}) {
  return useQuery({
    queryKey: ["technician-payments", filters],
    queryFn: async (): Promise<TechnicianPaymentsResponse> => {
      const searchParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });

      const response = await apiFetch(
        `/api/reports/technician-payments?${searchParams}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error obteniendo pagos a técnicos");
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos en cache
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}
