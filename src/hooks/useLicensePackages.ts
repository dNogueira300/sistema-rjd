"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type {
  LicensePackage,
  LicensePackagesResponse,
  CreateLicensePackageData,
  UpdateLicensePackageData,
} from "@/types/license";

const packagesAPI = {
  list: async (): Promise<LicensePackagesResponse> => {
    const res = await apiFetch("/api/license-packages");
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.error || "Error obteniendo paquetes");
    }
    return res.json();
  },
  create: async (data: CreateLicensePackageData): Promise<{ package: LicensePackage }> => {
    const res = await apiFetch("/api/license-packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.details || e.error || "Error creando paquete");
    }
    return res.json();
  },
  update: async (id: string, data: UpdateLicensePackageData): Promise<{ package: LicensePackage }> => {
    const res = await apiFetch(`/api/license-packages/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.details || e.error || "Error actualizando paquete");
    }
    return res.json();
  },
  remove: async (id: string): Promise<{ message: string; deletedId: string }> => {
    const res = await apiFetch(`/api/license-packages/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.details || e.error || "Error eliminando paquete");
    }
    return res.json();
  },
};

export function useLicensePackages() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["license-packages"],
    queryFn: packagesAPI.list,
    staleTime: 30000,
  });

  const createPackage = useMutation({
    mutationFn: packagesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["license-packages"] });
      toast.success("Paquete registrado exitosamente");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updatePackage = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLicensePackageData }) =>
      packagesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["license-packages"] });
      toast.success("Paquete actualizado exitosamente");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePackage = useMutation({
    mutationFn: packagesAPI.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["license-packages"] });
      toast.success("Paquete eliminado exitosamente");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const packages = useMemo(() => data?.packages ?? [], [data]);

  return {
    packages,
    total: data?.total ?? 0,
    isLoading,
    isError,
    error: error as Error | null,
    createPackage: createPackage.mutate,
    updatePackage: updatePackage.mutate,
    deletePackage: deletePackage.mutate,
    isMutating: createPackage.isPending || updatePackage.isPending || deletePackage.isPending,
    refetch,
  };
}
