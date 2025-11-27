// src/hooks/useEquipmentsList.ts
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  EquipmentResponse,
  EquipmentFilters,
  EquipmentStatus,
} from "@/types/equipment";

interface UseEquipmentsListOptions {
  initialFilters?: Partial<EquipmentFilters>;
  enabledByStatus?: boolean; // Para queries específicas por estado
  targetStatus?: EquipmentStatus; // Estado específico a consultar
}

// Hook optimizado solo para listas - sin datos completos
export function useEquipmentsList(options: UseEquipmentsListOptions = {}) {
  const { initialFilters, enabledByStatus, targetStatus } = options;

  // Estado de filtros con debounce en search
  const [filters, setFilters] = useState<EquipmentFilters>({
    search: "",
    status: targetStatus || "ALL",
    type: "ALL",
    sortBy: "entryDate",
    sortOrder: "desc",
    ...initialFilters,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  // Debounce de búsqueda (200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 200);

    return () => clearTimeout(timer);
  }, [filters.search]);

  // Filtros con búsqueda debounced
  const activeFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
    }),
    [filters, debouncedSearch]
  );

  // Query optimizada para lista
  const {
    data: equipmentsData,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["equipments-list", activeFilters, currentPage],
    queryFn: async (): Promise<EquipmentResponse> => {
      const searchParams = new URLSearchParams();
      Object.entries({ ...activeFilters, page: currentPage }).forEach(
        ([key, value]) => {
          if (value !== undefined && value !== "") {
            searchParams.append(key, String(value));
          }
        }
      );

      const response = await apiFetch(`/api/equipments?${searchParams}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error obteniendo equipos");
      }
      return response.json();
    },
    enabled: enabledByStatus ? !!targetStatus : true,
    staleTime: 3000, // 3 segundos - listas cambian frecuentemente
    gcTime: 2 * 60 * 1000, // 2 minutos en cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Funciones de utilidad
  const updateFilters = useCallback((newFilters: Partial<EquipmentFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset page when filters change
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: "",
      status: targetStatus || "ALL",
      type: "ALL",
      sortBy: "entryDate",
      sortOrder: "desc",
    });
    setCurrentPage(1);
  }, [targetStatus]);

  // Datos computados
  const equipments = useMemo(
    () => equipmentsData?.equipments ?? [],
    [equipmentsData]
  );
  const totalEquipments = useMemo(
    () => equipmentsData?.total ?? 0,
    [equipmentsData]
  );
  const totalPages = useMemo(
    () => equipmentsData?.totalPages ?? 0,
    [equipmentsData]
  );
  const hasNextPage = useMemo(
    () => equipmentsData?.hasNextPage ?? false,
    [equipmentsData]
  );
  const hasPreviousPage = useMemo(
    () => equipmentsData?.hasPreviousPage ?? false,
    [equipmentsData]
  );

  // Contar equipos por estado
  const equipmentsByStatus = useMemo(() => {
    return equipments.reduce((acc, eq) => {
      acc[eq.status] = (acc[eq.status] || 0) + 1;
      return acc;
    }, {} as Record<EquipmentStatus, number>);
  }, [equipments]);

  return {
    // Datos
    equipments,
    totalEquipments,
    totalPages,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    filters,
    equipmentsByStatus,
    isSearching: filters.search !== debouncedSearch, // Indica si hay búsqueda pendiente

    // Estados
    isLoading,
    isError,
    error: error as Error | null,
    isFetching,

    // Acciones
    updateFilters,
    resetFilters,
    setCurrentPage,
  };
}

// Hook para obtener equipos por estado específico (cache separado)
export function useEquipmentsByStatus(status: EquipmentStatus) {
  return useEquipmentsList({
    initialFilters: { status },
    enabledByStatus: true,
    targetStatus: status,
  });
}
