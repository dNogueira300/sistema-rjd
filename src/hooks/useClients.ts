// src/hooks/useClients.ts
"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type {
  Client,
  ClientResponse,
  CreateClientData,
  UpdateClientData,
  ClientFilters,
} from "@/types/client";

interface UseClientsOptions {
  initialFilters?: Partial<ClientFilters>;
}

interface ClientsAPI {
  getClients: (params: Record<string, unknown>) => Promise<ClientResponse>;
  getClient: (
    id: string
  ) => Promise<{ client: Client & { equipments?: unknown[] } }>;
  createClient: (data: CreateClientData) => Promise<{ client: Client }>;
  updateClient: (
    id: string,
    data: UpdateClientData
  ) => Promise<{ client: Client }>;
  deleteClient: (id: string) => Promise<{ message: string; deletedId: string }>;
}

// Funciones API con manejo automático de errores 401
const clientsAPI: ClientsAPI = {
  getClients: async (params) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.append(key, String(value));
      }
    });

    const response = await apiFetch(`/api/clients?${searchParams}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error obteniendo clientes");
    }
    return response.json();
  },

  getClient: async (id) => {
    const response = await apiFetch(`/api/clients/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error obteniendo cliente");
    }
    return response.json();
  },

  createClient: async (data) => {
    const response = await apiFetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error creando cliente");
    }
    return response.json();
  },

  updateClient: async (id, data) => {
    const response = await apiFetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error actualizando cliente");
    }
    return response.json();
  },

  deleteClient: async (id) => {
    const response = await apiFetch(`/api/clients/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.details || error.error || "Error eliminando cliente"
      );
    }
    return response.json();
  },
};

export function useClients(options: UseClientsOptions = {}) {
  const queryClient = useQueryClient();

  // Estado de filtros
  const [filters, setFilters] = useState<ClientFilters>({
    search: "",
    status: "ALL",
    sortBy: "name",
    sortOrder: "asc",
    ...options.initialFilters,
  });

  const [currentPage, setCurrentPage] = useState(1);

  // Query para obtener lista de clientes
  const {
    data: clientsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["clients", filters, currentPage],
    queryFn: () => clientsAPI.getClients({ ...filters, page: currentPage }),
    staleTime: 30000, // 30 segundos
    gcTime: 300000, // 5 minutos
  });

  // Mutation para crear cliente
  const createClientMutation = useMutation({
    mutationFn: clientsAPI.createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente creado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation para actualizar cliente
  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientData }) =>
      clientsAPI.updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente actualizado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation para eliminar cliente
  const deleteClientMutation = useMutation({
    mutationFn: clientsAPI.deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente eliminado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Funciones de utilidad
  const updateFilters = useCallback((newFilters: Partial<ClientFilters>) => {
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

  const refreshClients = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  }, [queryClient]);

  // Datos computados
  const clients = useMemo(() => clientsData?.clients ?? [], [clientsData]);
  const totalClients = useMemo(() => clientsData?.total ?? 0, [clientsData]);
  const totalPages = useMemo(() => clientsData?.totalPages ?? 0, [clientsData]);
  const hasNextPage = useMemo(
    () => clientsData?.hasNextPage ?? false,
    [clientsData]
  );
  const hasPreviousPage = useMemo(
    () => clientsData?.hasPreviousPage ?? false,
    [clientsData]
  );

  // Estados de carga
  const isCreating = createClientMutation.isPending;
  const isUpdating = updateClientMutation.isPending;
  const isDeleting = deleteClientMutation.isPending;
  const isMutating = isCreating || isUpdating || isDeleting;

  return {
    // Datos
    clients,
    totalClients,
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
    createClient: createClientMutation.mutate,
    updateClient: updateClientMutation.mutate,
    deleteClient: deleteClientMutation.mutate,
    updateFilters,
    resetFilters,
    refreshClients,
    setCurrentPage,

    // Utilidades
    getClient: (id: string) =>
      queryClient.fetchQuery({
        queryKey: ["client", id],
        queryFn: () => clientsAPI.getClient(id),
        staleTime: 60000, // 1 minuto
      }),
  };
}

// Hook para obtener un cliente específico
export function useClient(id: string | null) {
  return useQuery({
    queryKey: ["client", id],
    queryFn: () => clientsAPI.getClient(id!),
    enabled: !!id,
    staleTime: 60000,
  });
}
