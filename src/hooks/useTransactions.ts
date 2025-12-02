// src/hooks/useTransactions.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  TransactionsResponse,
  TransactionFilters,
  CreatePaymentData,
  CreateExpenseData,
  FinanceMetrics,
} from "@/types/finance";

// Hook para obtener transacciones
export function useTransactions(filters: TransactionFilters) {
  const queryParams = new URLSearchParams();

  if (filters.type !== "ALL") queryParams.set("type", filters.type);
  if (filters.startDate)
    queryParams.set("startDate", filters.startDate.toISOString());
  if (filters.endDate)
    queryParams.set("endDate", filters.endDate.toISOString());
  if (filters.search) queryParams.set("search", filters.search);
  if (filters.paymentMethod !== "ALL")
    queryParams.set("paymentMethod", filters.paymentMethod);
  if (filters.technicianId) queryParams.set("technicianId", filters.technicianId);
  queryParams.set("sortBy", filters.sortBy);
  queryParams.set("sortOrder", filters.sortOrder);

  return useQuery<TransactionsResponse>({
    queryKey: ["transactions", filters],
    queryFn: async () => {
      const response = await apiFetch(`/api/transactions?${queryParams}`);
      if (!response.ok) {
        throw new Error("Error al cargar transacciones");
      }
      return response.json();
    },
  });
}

// Hook para obtener métricas
export function useFinanceMetrics() {
  return useQuery<FinanceMetrics>({
    queryKey: ["finance-metrics"],
    queryFn: async () => {
      const response = await apiFetch("/api/transactions/metrics");
      if (!response.ok) {
        throw new Error("Error al cargar métricas");
      }
      return response.json();
    },
    staleTime: 0, // Siempre considerar datos obsoletos
    refetchOnMount: "always", // Refetch al montar el componente
    refetchInterval: 30000, // Actualizar cada 30 segundos
  });
}

// Hook para crear un pago (Ingreso)
export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaymentData) => {
      const response = await apiFetch("/api/payments", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear pago");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["equipments"] });
    },
  });
}

// Hook para actualizar un pago (Ingreso)
export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreatePaymentData> }) => {
      const response = await apiFetch(`/api/payments/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar pago");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["equipments"] });
    },
  });
}

// Hook para crear un egreso
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateExpenseData) => {
      const response = await apiFetch("/api/expenses", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear egreso");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance-metrics"] });
    },
  });
}
