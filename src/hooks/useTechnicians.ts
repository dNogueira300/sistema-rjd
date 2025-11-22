// src/hooks/useTechnicians.ts
"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type {
  Technician,
  TechnicianResponse,
  CreateTechnicianData,
  UpdateTechnicianData,
  TechnicianFilters,
} from "@/types/technician";

interface UseTechniciansOptions {
  initialFilters?: Partial<TechnicianFilters>;
}

interface TechniciansAPI {
  getTechnicians: (params: Record<string, unknown>) => Promise<TechnicianResponse>;
  getTechnician: (
    id: string
  ) => Promise<{ technician: Technician; equipments?: unknown[] }>;
  createTechnician: (data: CreateTechnicianData) => Promise<{ technician: Technician }>;
  updateTechnician: (
    id: string,
    data: UpdateTechnicianData
  ) => Promise<{ technician: Technician }>;
  deleteTechnician: (id: string) => Promise<{ message: string; deletedId: string }>;
}

// Funciones API con manejo automático de errores 401
const techniciansAPI: TechniciansAPI = {
  getTechnicians: async (params) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.append(key, String(value));
      }
    });

    const response = await apiFetch(`/api/tecnicos?${searchParams}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error obteniendo técnicos");
    }
    return response.json();
  },

  getTechnician: async (id) => {
    const response = await apiFetch(`/api/tecnicos/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error obteniendo técnico");
    }
    return response.json();
  },

  createTechnician: async (data) => {
    const response = await apiFetch("/api/tecnicos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error creando técnico");
    }
    return response.json();
  },

  updateTechnician: async (id, data) => {
    const response = await apiFetch(`/api/tecnicos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error actualizando técnico");
    }
    return response.json();
  },

  deleteTechnician: async (id) => {
    const response = await apiFetch(`/api/tecnicos/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.details || error.error || "Error eliminando técnico"
      );
    }
    return response.json();
  },
};

export function useTechnicians(options: UseTechniciansOptions = {}) {
  const queryClient = useQueryClient();

  // Estado de filtros
  const [filters, setFilters] = useState<TechnicianFilters>({
    search: "",
    status: "ALL",
    sortBy: "name",
    sortOrder: "asc",
    ...options.initialFilters,
  });

  const [currentPage, setCurrentPage] = useState(1);

  // Query para obtener lista de técnicos
  const {
    data: techniciansData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["technicians", filters, currentPage],
    queryFn: () => techniciansAPI.getTechnicians({ ...filters, page: currentPage }),
    staleTime: 30000, // 30 segundos
    gcTime: 300000, // 5 minutos
  });

  // Mutation para crear técnico
  const createTechnicianMutation = useMutation({
    mutationFn: techniciansAPI.createTechnician,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
      toast.success("Técnico creado exitosamente. Contraseña temporal: temp123");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation para actualizar técnico
  const updateTechnicianMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTechnicianData }) =>
      techniciansAPI.updateTechnician(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
      toast.success("Técnico actualizado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation para eliminar técnico
  const deleteTechnicianMutation = useMutation({
    mutationFn: techniciansAPI.deleteTechnician,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
      toast.success("Técnico eliminado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Funciones de utilidad
  const updateFilters = useCallback((newFilters: Partial<TechnicianFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset page when filters change
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: "",
      status: "ALL",
      sortBy: "name",
      sortOrder: "asc",
    });
    setCurrentPage(1);
  }, []);

  const refreshTechnicians = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["technicians"] });
  }, [queryClient]);

  // Datos computados
  const technicians = useMemo(() => techniciansData?.technicians ?? [], [techniciansData]);
  const totalTechnicians = useMemo(() => techniciansData?.total ?? 0, [techniciansData]);
  const totalPages = useMemo(() => techniciansData?.totalPages ?? 0, [techniciansData]);
  const hasNextPage = useMemo(
    () => techniciansData?.hasNextPage ?? false,
    [techniciansData]
  );
  const hasPreviousPage = useMemo(
    () => techniciansData?.hasPreviousPage ?? false,
    [techniciansData]
  );

  // Estados de carga
  const isCreating = createTechnicianMutation.isPending;
  const isUpdating = updateTechnicianMutation.isPending;
  const isDeleting = deleteTechnicianMutation.isPending;
  const isMutating = isCreating || isUpdating || isDeleting;

  return {
    // Datos
    technicians,
    totalTechnicians,
    totalPages,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    filters,

    // Estados
    isLoading,
    isError,
    error: error as Error | null,
    isCreating,
    isUpdating,
    isDeleting,
    isMutating,

    // Acciones
    createTechnician: createTechnicianMutation.mutate,
    updateTechnician: updateTechnicianMutation.mutate,
    deleteTechnician: deleteTechnicianMutation.mutate,
    updateFilters,
    resetFilters,
    refreshTechnicians,
    setCurrentPage,

    // Utilidades
    getTechnician: (id: string) =>
      queryClient.fetchQuery({
        queryKey: ["technician", id],
        queryFn: () => techniciansAPI.getTechnician(id),
        staleTime: 60000, // 1 minuto
      }),
  };
}

// Hook para obtener un técnico específico
export function useTechnician(id: string | null) {
  return useQuery({
    queryKey: ["technician", id],
    queryFn: () => techniciansAPI.getTechnician(id!),
    enabled: !!id,
    staleTime: 60000,
  });
}
