"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type {
  LicenseActivation,
  LicenseActivationsResponse,
  LicenseActivationFilters,
  CreateLicenseActivationData,
  UpdateLicenseActivationData,
} from "@/types/license";

function buildQuery(filters: LicenseActivationFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.append(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

const activationsAPI = {
  list: async (filters: LicenseActivationFilters): Promise<LicenseActivationsResponse> => {
    const res = await apiFetch(`/api/license-activations${buildQuery(filters)}`);
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.error || "Error obteniendo activaciones");
    }
    return res.json();
  },
  create: async (data: CreateLicenseActivationData): Promise<{ activation: LicenseActivation }> => {
    const res = await apiFetch("/api/license-activations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.details || e.error || "Error creando activación");
    }
    return res.json();
  },
  update: async (id: string, data: UpdateLicenseActivationData): Promise<{ activation: LicenseActivation }> => {
    const res = await apiFetch(`/api/license-activations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.details || e.error || "Error actualizando activación");
    }
    return res.json();
  },
  remove: async (id: string): Promise<{ message: string; deletedId: string }> => {
    const res = await apiFetch(`/api/license-activations/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.details || e.error || "Error eliminando activación");
    }
    return res.json();
  },
};

export function useLicenseActivations(filters: LicenseActivationFilters = {}) {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["license-activations"] });
    queryClient.invalidateQueries({ queryKey: ["license-packages"] });
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["license-activations", filters],
    queryFn: () => activationsAPI.list(filters),
    staleTime: 30000,
  });

  const createActivation = useMutation({
    mutationFn: activationsAPI.create,
    onSuccess: () => {
      invalidateAll();
      toast.success("Activación registrada exitosamente");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateActivation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLicenseActivationData }) =>
      activationsAPI.update(id, data),
    onSuccess: () => {
      invalidateAll();
      toast.success("Activación actualizada exitosamente");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteActivation = useMutation({
    mutationFn: activationsAPI.remove,
    onSuccess: () => {
      invalidateAll();
      toast.success("Activación eliminada exitosamente");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activations = useMemo(() => data?.activations ?? [], [data]);

  return {
    activations,
    total: data?.total ?? 0,
    isLoading,
    isError,
    error: error as Error | null,
    createActivation: createActivation.mutate,
    updateActivation: updateActivation.mutate,
    deleteActivation: deleteActivation.mutate,
    isMutating:
      createActivation.isPending || updateActivation.isPending || deleteActivation.isPending,
    refetch,
  };
}
