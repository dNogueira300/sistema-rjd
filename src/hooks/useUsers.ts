// src/hooks/useUsers.ts
"use client";

import { useState, useCallback, useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type {
  SystemUser,
  UsersResponse,
  UserFilters,
  CreateUserData,
  UpdateUserData,
} from "@/types/user";

async function parseError(res: Response, fallback: string): Promise<never> {
  const body = await res.json().catch(() => ({}));
  throw new Error(body.details || body.error || fallback);
}

const usersAPI = {
  list: async (params: Record<string, unknown>): Promise<UsersResponse> => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.append(k, String(v));
    });
    const res = await apiFetch(`/api/usuarios?${qs}`);
    if (!res.ok) return parseError(res, "Error obteniendo usuarios");
    return res.json();
  },
  create: async (data: CreateUserData): Promise<{ user: SystemUser }> => {
    const res = await apiFetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return parseError(res, "Error creando usuario");
    return res.json();
  },
  update: async (
    id: string,
    data: UpdateUserData
  ): Promise<{ user: SystemUser }> => {
    const res = await apiFetch(`/api/usuarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return parseError(res, "Error actualizando usuario");
    return res.json();
  },
  remove: async (id: string): Promise<{ deletedId: string }> => {
    const res = await apiFetch(`/api/usuarios/${id}`, { method: "DELETE" });
    if (!res.ok) return parseError(res, "Error eliminando usuario");
    return res.json();
  },
};

export function useUsers() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    role: "ALL",
    status: "ALL",
    sortBy: "name",
    sortOrder: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["users", filters, currentPage],
    queryFn: () => usersAPI.list({ ...filters, page: currentPage }),
    staleTime: 30000,
    placeholderData: keepPreviousData,
  });

  // Los técnicos se listan en otros módulos: mantenerlos sincronizados
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
    queryClient.invalidateQueries({ queryKey: ["technicians"] });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: usersAPI.create,
    onSuccess: ({ user }) => {
      invalidate();
      toast.success(`Usuario ${user.name} creado exitosamente`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      usersAPI.update(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Usuario actualizado exitosamente");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: usersAPI.remove,
    onSuccess: () => {
      invalidate();
      toast.success("Usuario eliminado exitosamente");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateFilters = useCallback((next: Partial<UserFilters>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setCurrentPage(1);
  }, []);

  const users = useMemo(() => data?.users ?? [], [data]);

  return {
    users,
    stats: data?.stats,
    total: data?.total ?? 0,
    currentPage,
    totalPages: data?.totalPages ?? 1,
    hasNextPage: data?.hasNextPage ?? false,
    hasPreviousPage: data?.hasPreviousPage ?? false,
    filters,
    isLoading,
    isFetching,
    isError,
    error: error as Error | null,
    createUser: createMutation.mutate,
    updateUser: updateMutation.mutate,
    deleteUser: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    updateFilters,
    setCurrentPage,
    refresh: refetch,
  };
}
