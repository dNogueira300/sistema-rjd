// src/hooks/useEquipments.ts
"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type {
  Equipment,
  EquipmentResponse,
  CreateEquipmentData,
  UpdateEquipmentData,
  ChangeStatusData,
  EquipmentFilters,
  EquipmentStatusHistoryItem,
} from "@/types/equipment";

interface UseEquipmentsOptions {
  initialFilters?: Partial<EquipmentFilters>;
}

interface EquipmentsAPI {
  getEquipments: (params: Record<string, unknown>) => Promise<EquipmentResponse>;
  getEquipment: (
    id: string
  ) => Promise<{ equipment: Equipment }>;
  createEquipment: (data: CreateEquipmentData) => Promise<{ equipment: Equipment }>;
  updateEquipment: (
    id: string,
    data: UpdateEquipmentData
  ) => Promise<{ equipment: Equipment }>;
  deleteEquipment: (id: string) => Promise<{ message: string; deletedId: string }>;
  changeStatus: (data: ChangeStatusData) => Promise<{ equipment: Equipment; message: string }>;
  getStatusHistory: (equipmentId: string) => Promise<{ history: EquipmentStatusHistoryItem[] }>;
}

// Funciones API con manejo automático de errores 401
const equipmentsAPI: EquipmentsAPI = {
  getEquipments: async (params) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.append(key, String(value));
      }
    });

    const response = await apiFetch(`/api/equipments?${searchParams}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error obteniendo equipos");
    }
    return response.json();
  },

  getEquipment: async (id) => {
    const response = await apiFetch(`/api/equipments/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error obteniendo equipo");
    }
    return response.json();
  },

  createEquipment: async (data) => {
    const response = await apiFetch("/api/equipments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error creando equipo");
    }
    return response.json();
  },

  updateEquipment: async (id, data) => {
    const response = await apiFetch(`/api/equipments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error actualizando equipo");
    }
    return response.json();
  },

  deleteEquipment: async (id) => {
    const response = await apiFetch(`/api/equipments/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.details || error.error || "Error eliminando equipo"
      );
    }
    return response.json();
  },

  changeStatus: async (data) => {
    const response = await apiFetch("/api/equipments/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error cambiando estado");
    }
    return response.json();
  },

  getStatusHistory: async (equipmentId) => {
    const response = await apiFetch(`/api/equipments/status?equipmentId=${equipmentId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error obteniendo historial");
    }
    return response.json();
  },
};

export function useEquipments(options: UseEquipmentsOptions = {}) {
  const queryClient = useQueryClient();

  // Estado de filtros
  const [filters, setFilters] = useState<EquipmentFilters>({
    search: "",
    status: "ALL",
    type: "ALL",
    sortBy: "entryDate",
    sortOrder: "desc",
    ...options.initialFilters,
  });

  const [currentPage, setCurrentPage] = useState(1);

  // Query para obtener lista de equipos
  const {
    data: equipmentsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["equipments", filters, currentPage],
    queryFn: () => equipmentsAPI.getEquipments({ ...filters, page: currentPage }),
    staleTime: 30000, // 30 segundos
    gcTime: 300000, // 5 minutos
  });

  // Mutation para crear equipo con optimistic update
  const createEquipmentMutation = useMutation({
    mutationFn: equipmentsAPI.createEquipment,
    onMutate: async (newEquipment) => {
      // Cancelar queries existentes para evitar conflictos
      await queryClient.cancelQueries({ queryKey: ["equipments"] });

      // Snapshot del estado anterior para rollback
      const previousEquipments = queryClient.getQueryData<EquipmentResponse>([
        "equipments",
        filters,
        currentPage,
      ]);

      // Actualización optimista: agregar equipo temporal a la UI
      if (previousEquipments) {
        const optimisticEquipment: Equipment = {
          id: `temp-${Date.now()}`,
          code: "GENERANDO...",
          type: newEquipment.type,
          brand: newEquipment.brand || null,
          model: newEquipment.model || null,
          serialNumber: newEquipment.serialNumber || null,
          reportedFlaw: newEquipment.reportedFlaw,
          accessories: newEquipment.accessories || null,
          serviceType: newEquipment.serviceType || null,
          others: newEquipment.others || null,
          status: "RECEIVED",
          entryDate: new Date(),
          deliveryDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          customerId: newEquipment.customerId,
          assignedTechnicianId: null,
          customer: {
            id: newEquipment.customerId,
            name: "Cargando...",
            phone: "",
          },
          assignedTechnician: null,
        };

        queryClient.setQueryData<EquipmentResponse>(
          ["equipments", filters, currentPage],
          {
            ...previousEquipments,
            equipments: [optimisticEquipment, ...previousEquipments.equipments],
            total: previousEquipments.total + 1,
          }
        );
      }

      return { previousEquipments };
    },
    onError: (error: Error, _newEquipment, context) => {
      // Rollback automático en caso de error
      if (context?.previousEquipments) {
        queryClient.setQueryData(
          ["equipments", filters, currentPage],
          context.previousEquipments
        );
      }
      toast.error(error.message);
    },
    onSuccess: () => {
      // Solo invalidar queries necesarias
      queryClient.invalidateQueries({ queryKey: ["equipments"] });
      toast.success("Equipo registrado exitosamente");
    },
  });

  // Mutation para actualizar equipo
  const updateEquipmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEquipmentData }) =>
      equipmentsAPI.updateEquipment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipments"] });
      toast.success("Equipo actualizado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation para eliminar equipo
  const deleteEquipmentMutation = useMutation({
    mutationFn: equipmentsAPI.deleteEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipments"] });
      toast.success("Equipo eliminado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation para cambiar estado con optimistic update
  const changeStatusMutation = useMutation({
    mutationFn: equipmentsAPI.changeStatus,
    onMutate: async (statusChange) => {
      // Cancelar queries existentes
      await queryClient.cancelQueries({ queryKey: ["equipments"] });
      await queryClient.cancelQueries({
        queryKey: ["equipment", statusChange.equipmentId],
      });

      // Snapshot para rollback
      const previousEquipments = queryClient.getQueryData<EquipmentResponse>([
        "equipments",
        filters,
        currentPage,
      ]);

      // Actualización optimista del estado en la lista
      if (previousEquipments) {
        const updatedEquipments = previousEquipments.equipments.map((eq) =>
          eq.id === statusChange.equipmentId
            ? {
                ...eq,
                status: statusChange.newStatus,
                assignedTechnicianId:
                  statusChange.assignedTechnicianId !== undefined
                    ? statusChange.assignedTechnicianId
                    : eq.assignedTechnicianId,
              }
            : eq
        );

        queryClient.setQueryData<EquipmentResponse>(
          ["equipments", filters, currentPage],
          {
            ...previousEquipments,
            equipments: updatedEquipments,
          }
        );
      }

      return { previousEquipments };
    },
    onError: (error: Error, _statusChange, context) => {
      // Rollback automático
      if (context?.previousEquipments) {
        queryClient.setQueryData(
          ["equipments", filters, currentPage],
          context.previousEquipments
        );
      }
      toast.error(error.message);
    },
    onSuccess: (data) => {
      // Invalidar queries específicas
      queryClient.invalidateQueries({ queryKey: ["equipments"] });
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      queryClient.invalidateQueries({ queryKey: ["finance-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(data.message || "Estado actualizado exitosamente");
    },
  });

  // Funciones de utilidad
  const updateFilters = useCallback((newFilters: Partial<EquipmentFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset page when filters change
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: "",
      status: "ALL",
      type: "ALL",
      sortBy: "entryDate",
      sortOrder: "desc",
    });
    setCurrentPage(1);
  }, []);

  const refreshEquipments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["equipments"] });
  }, [queryClient]);

  // Datos computados
  const equipments = useMemo(() => equipmentsData?.equipments ?? [], [equipmentsData]);
  const totalEquipments = useMemo(() => equipmentsData?.total ?? 0, [equipmentsData]);
  const totalPages = useMemo(() => equipmentsData?.totalPages ?? 0, [equipmentsData]);
  const hasNextPage = useMemo(
    () => equipmentsData?.hasNextPage ?? false,
    [equipmentsData]
  );
  const hasPreviousPage = useMemo(
    () => equipmentsData?.hasPreviousPage ?? false,
    [equipmentsData]
  );

  // Contar equipos por estado para notificaciones
  const repairedCount = useMemo(
    () => equipments.filter((e) => e.status === "REPAIRED").length,
    [equipments]
  );

  // Estados de carga
  const isCreating = createEquipmentMutation.isPending;
  const isUpdating = updateEquipmentMutation.isPending;
  const isDeleting = deleteEquipmentMutation.isPending;
  const isChangingStatus = changeStatusMutation.isPending;
  const isMutating = isCreating || isUpdating || isDeleting || isChangingStatus;

  return {
    // Datos
    equipments,
    totalEquipments,
    totalPages,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    filters,
    repairedCount,

    // Estados
    isLoading,
    isError,
    error: error as Error | null,
    isCreating,
    isUpdating,
    isDeleting,
    isChangingStatus,
    isMutating,

    // Acciones
    createEquipment: createEquipmentMutation.mutate,
    updateEquipment: updateEquipmentMutation.mutate,
    deleteEquipment: deleteEquipmentMutation.mutate,
    changeStatus: changeStatusMutation.mutate,
    updateFilters,
    resetFilters,
    refreshEquipments,
    setCurrentPage,

    // Utilidades
    getEquipment: (id: string) =>
      queryClient.fetchQuery({
        queryKey: ["equipment", id],
        queryFn: () => equipmentsAPI.getEquipment(id),
        staleTime: 60000, // 1 minuto
      }),
    getStatusHistory: (equipmentId: string) =>
      equipmentsAPI.getStatusHistory(equipmentId),
  };
}

// Hook para obtener un equipo específico
export function useEquipment(id: string | null) {
  return useQuery({
    queryKey: ["equipment", id],
    queryFn: () => equipmentsAPI.getEquipment(id!),
    enabled: !!id,
    staleTime: 60000,
  });
}
