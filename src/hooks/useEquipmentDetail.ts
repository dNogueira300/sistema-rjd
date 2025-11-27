// src/hooks/useEquipmentDetail.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Equipment } from "@/types/equipment";

interface EquipmentDetailResponse {
  equipment: Equipment;
}

// Hook optimizado para obtener detalles completos de un equipo
// Incluye historial de estados y pagos - solo para modales/formularios
export function useEquipmentDetail(id: string | null) {
  return useQuery({
    queryKey: ["equipment-detail", id],
    queryFn: async (): Promise<EquipmentDetailResponse> => {
      if (!id) throw new Error("ID requerido");

      const response = await apiFetch(`/api/equipments/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error obteniendo equipo");
      }
      return response.json();
    },
    enabled: !!id,
    staleTime: 30000, // 30 segundos - detalles menos frecuentes
    gcTime: 5 * 60 * 1000, // 5 minutos en cache
    refetchOnWindowFocus: false,
  });
}

// Hook para obtener solo datos básicos (más rápido, sin historial ni pagos)
export function useEquipmentBasic(id: string | null) {
  return useQuery({
    queryKey: ["equipment-basic", id],
    queryFn: async (): Promise<{ equipment: Equipment }> => {
      if (!id) throw new Error("ID requerido");

      const response = await apiFetch(`/api/equipments/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error obteniendo equipo");
      }
      const data = await response.json();

      // Retornar solo datos básicos sin historial ni pagos
      return {
        equipment: {
          ...data.equipment,
          statusHistory: undefined,
          payments: undefined,
        },
      };
    },
    enabled: !!id,
    staleTime: 10000, // 10 segundos - datos básicos pueden ser más frescos
    gcTime: 2 * 60 * 1000, // 2 minutos en cache
    refetchOnWindowFocus: false,
  });
}
