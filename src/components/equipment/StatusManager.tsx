// src/components/equipment/StatusManager.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  Clock,
  Wrench,
  Truck,
  XCircle,
  ArrowRight,
  User,
  MessageSquare,
  X,
  Loader2,
  History,
  AlertTriangle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type {
  Equipment,
  EquipmentStatus,
  EquipmentStatusHistoryItem,
  ChangeStatusData,
} from "@/types/equipment";

interface Technician {
  id: string;
  name: string;
  email: string;
}

interface StatusManagerProps {
  equipment: Equipment;
  userRole: "ADMINISTRADOR" | "TECNICO";
  onStatusChange: (data: ChangeStatusData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<
  EquipmentStatus,
  { label: string; icon: React.ReactNode; color: string }
> = {
  RECEIVED: {
    label: "Recibido",
    icon: <Clock className="w-5 h-5" />,
    color: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  },
  REPAIR: {
    label: "En Reparación",
    icon: <Wrench className="w-5 h-5" />,
    color: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
  },
  REPAIRED: {
    label: "Reparado",
    icon: <CheckCircle className="w-5 h-5" />,
    color: "bg-green-600/20 text-green-400 border-green-600/30",
  },
  DELIVERED: {
    label: "Entregado",
    icon: <Truck className="w-5 h-5" />,
    color: "bg-purple-600/20 text-purple-400 border-purple-600/30",
  },
  CANCELLED: {
    label: "Cancelado",
    icon: <XCircle className="w-5 h-5" />,
    color: "bg-red-600/20 text-red-400 border-red-600/30",
  },
};

// Transiciones válidas por estado actual
const VALID_TRANSITIONS: Record<EquipmentStatus, EquipmentStatus[]> = {
  RECEIVED: ["REPAIR", "CANCELLED"],
  REPAIR: ["REPAIRED", "CANCELLED"],
  REPAIRED: ["DELIVERED", "REPAIR"],
  DELIVERED: [],
  CANCELLED: [],
};

export default function StatusManager({
  equipment,
  userRole,
  onStatusChange,
  onClose,
  isLoading = false,
}: StatusManagerProps) {
  const [selectedStatus, setSelectedStatus] = useState<EquipmentStatus | null>(
    null
  );
  const [selectedTechnician, setSelectedTechnician] = useState<string>("");
  const [observations, setObservations] = useState("");
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [history, setHistory] = useState<EquipmentStatusHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // Cargar técnicos disponibles
  useEffect(() => {
    const loadTechnicians = async () => {
      setLoadingTechnicians(true);
      try {
        const response = await apiFetch(
          "/api/tecnicos?status=ACTIVE&limit=100"
        );
        if (response.ok) {
          const data = await response.json();
          setTechnicians(data.technicians);
        }
      } catch (error) {
        console.error("Error cargando técnicos:", error);
      } finally {
        setLoadingTechnicians(false);
      }
    };

    if (userRole === "ADMINISTRADOR") {
      loadTechnicians();
    }
  }, [userRole]);

  // Cargar historial de estados
  useEffect(() => {
    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const response = await apiFetch(
          `/api/equipments/status?equipmentId=${equipment.id}`
        );
        if (response.ok) {
          const data = await response.json();
          setHistory(data.history);
        }
      } catch (error) {
        console.error("Error cargando historial:", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [equipment.id]);

  // Obtener estados disponibles según rol y estado actual
  const availableTransitions = useCallback((): EquipmentStatus[] => {
    const validStates = VALID_TRANSITIONS[equipment.status] || [];

    if (userRole === "ADMINISTRADOR") {
      return validStates;
    }

    // Técnico solo puede cambiar a REPAIRED
    if (userRole === "TECNICO" && equipment.status === "REPAIR") {
      return ["REPAIRED"];
    }

    return [];
  }, [equipment.status, userRole]);

  // Verificar si hay pago completo
  const hasCompletedPayment = equipment.payments?.some(
    (payment) => payment.paymentStatus === "COMPLETED"
  );

  const handleSubmit = useCallback(() => {
    if (!selectedStatus) return;

    // Validar que se seleccione técnico si el nuevo estado es REPAIR
    if (selectedStatus === "REPAIR" && !selectedTechnician) {
      return;
    }

    const changeData: ChangeStatusData = {
      equipmentId: equipment.id,
      newStatus: selectedStatus,
      observations: observations || undefined,
    };

    if (selectedStatus === "REPAIR" && selectedTechnician) {
      changeData.assignedTechnicianId = selectedTechnician;
    }

    onStatusChange(changeData);
  }, [
    selectedStatus,
    selectedTechnician,
    observations,
    equipment.id,
    onStatusChange,
  ]);

  const transitions = availableTransitions();
  const canChangeStatus = transitions.length > 0;
  const needsTechnician = selectedStatus === "REPAIR";
  const needsPayment = selectedStatus === "DELIVERED" && !hasCompletedPayment;
  const isSubmitDisabled =
    !selectedStatus ||
    (needsTechnician && !selectedTechnician) ||
    needsPayment ||
    isLoading;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-100">
                Gestionar Estado
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Equipo:{" "}
                <span className="font-mono text-blue-400">
                  {equipment.code}
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Estado Actual */}
          <div>
            <label className="text-sm font-medium text-slate-200 mb-2 block">
              Estado Actual
            </label>
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${
                STATUS_CONFIG[equipment.status].color
              }`}
            >
              {STATUS_CONFIG[equipment.status].icon}
              <span className="font-medium">
                {STATUS_CONFIG[equipment.status].label}
              </span>
            </div>
          </div>

          {/* Cambiar Estado */}
          {canChangeStatus ? (
            <div>
              <label className="text-sm font-medium text-slate-200 mb-3 block">
                Cambiar a
              </label>
              <div className="grid grid-cols-1 gap-2">
                {transitions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    disabled={isLoading}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      selectedStatus === status
                        ? STATUS_CONFIG[status].color
                        : "bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {STATUS_CONFIG[status].icon}
                    <span className="font-medium">
                      {STATUS_CONFIG[status].label}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-dark p-4 rounded-lg border border-slate-600 text-center">
              <p className="text-slate-400">
                No hay cambios de estado disponibles
                {userRole === "TECNICO" && " para tu rol"}
              </p>
            </div>
          )}

          {/* Selector de Técnico (solo si se cambia a REPAIR) */}
          {needsTechnician && userRole === "ADMINISTRADOR" && (
            <div>
              <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-blue-400" />
                Asignar Técnico *
              </label>
              {loadingTechnicians ? (
                <div className="flex items-center gap-2 text-slate-400 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cargando técnicos...</span>
                </div>
              ) : (
                <select
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  className="input-dark w-full"
                  disabled={isLoading}
                >
                  <option value="">Seleccionar técnico...</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name} ({tech.email})
                    </option>
                  ))}
                </select>
              )}
              {!selectedTechnician && selectedStatus === "REPAIR" && (
                <p className="text-amber-400 text-xs mt-1">
                  Debe seleccionar un técnico para asignar el equipo
                </p>
              )}
            </div>
          )}

          {/* Advertencia de pago pendiente (solo si se cambia a DELIVERED sin pago) */}
          {needsPayment && (
            <div className="glass-dark p-4 rounded-lg border border-amber-600/30 bg-amber-600/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-amber-400 font-medium text-sm">
                    Pago pendiente
                  </p>
                  <p className="text-amber-400/80 text-xs mt-1">
                    No se puede marcar como entregado sin registrar un pago
                    total completado. Por favor, registre el pago completo antes
                    de cambiar el estado a entregado.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Observaciones */}
          {selectedStatus && (
            <div>
              <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-green-400" />
                Observaciones
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="input-dark w-full min-h-20 resize-y"
                placeholder="Agregar observaciones sobre el cambio de estado..."
                disabled={isLoading}
              />
            </div>
          )}

          {/* Historial */}
          <div>
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              <History className="w-4 h-4" />
              {showHistory ? "Ocultar historial" : "Ver historial de estados"}
            </button>

            {showHistory && (
              <div className="mt-3 space-y-2">
                {loadingHistory ? (
                  <div className="flex items-center gap-2 text-slate-400 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cargando historial...</span>
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-slate-500 text-sm">Sin historial</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="glass-dark p-3 rounded-lg border border-slate-700 text-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                              STATUS_CONFIG[item.status].color
                            }`}
                          >
                            {STATUS_CONFIG[item.status].label}
                          </span>
                          <span className="text-slate-500 text-xs">
                            {new Date(item.changedAt).toLocaleString()}
                          </span>
                        </div>
                        {item.changedByUser && (
                          <p className="text-slate-400 text-xs mt-1">
                            Por: {item.changedByUser.name}
                          </p>
                        )}
                        {item.observations && (
                          <p className="text-slate-300 text-xs mt-1 italic">
                            &quot;{item.observations}&quot;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-slate-700 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            Cancelar
          </button>
          {canChangeStatus && (
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-primary-dark flex-1 py-3 px-4 rounded-xl disabled:opacity-50"
              disabled={isSubmitDisabled}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Actualizando...</span>
                </div>
              ) : (
                "Confirmar Cambio"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
