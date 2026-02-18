// src/components/equipment/EquipmentManageFullModal.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  User,
  Banknote,
  Save,
  Loader2,
  Laptop,
  Monitor,
  Printer,
  Package,
  Phone,
  AlertTriangle,
  Clock,
  UserCog,
  RefreshCw,
  Undo2,
  ChevronRight,
  Wrench,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatPhone } from "@/lib/validations/client";
import type {
  Equipment,
  EquipmentStatus,
  PaymentMethod,
  EquipmentType,
} from "@/types/equipment";
import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUS_COLORS,
  EQUIPMENT_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/types/equipment";

interface Technician {
  id: string;
  name: string;
  email: string;
}

interface EquipmentManageFullModalProps {
  equipment: Equipment;
  userRole: "ADMINISTRADOR" | "TECNICO";
  onClose: () => void;
  onSuccess: () => void;
  onEdit?: (equipment: Equipment) => void;
}

const getTypeIcon = (type: EquipmentType) => {
  switch (type) {
    case "PC":
      return <Monitor className="w-5 h-5 text-blue-400" />;
    case "LAPTOP":
      return <Laptop className="w-5 h-5 text-purple-400" />;
    case "PRINTER":
    case "PLOTTER":
      return <Printer className="w-5 h-5 text-green-400" />;
    default:
      return <Package className="w-5 h-5 text-gray-400" />;
  }
};

// Mostrar todos los estados disponibles (excepto el actual)
const getAllStatuses = (
  currentStatus: EquipmentStatus,
  userRole: "ADMINISTRADOR" | "TECNICO"
): EquipmentStatus[] => {
  // Todos los estados posibles
  const allStatuses: EquipmentStatus[] = [
    "RECEIVED",
    "REPAIR",
    "REPAIRED",
    "DELIVERED",
    "CANCELLED",
  ];

  if (userRole === "TECNICO") {
    // Técnico solo puede marcar como reparado si está en reparación
    if (currentStatus === "REPAIR") return ["REPAIRED"];
    return [];
  }

  // Admin puede ver todos los estados excepto el actual
  return allStatuses.filter((status) => status !== currentStatus);
};

export default function EquipmentManageFullModal({
  equipment,
  userRole,
  onClose,
  onSuccess,
  onEdit,
}: EquipmentManageFullModalProps) {
  // Estados
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(true);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>(
    equipment.assignedTechnicianId || ""
  );
  const [isSavingTechnician, setIsSavingTechnician] = useState(false);

  // Estado
  const [selectedStatus, setSelectedStatus] = useState<EquipmentStatus | "">(
    ""
  );
  const [statusObservations, setStatusObservations] = useState("");
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  // Pago (solo visible cuando se selecciona DELIVERED)
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const existingPayment = equipment.payments?.[0];
  const existingIsPartial = existingPayment?.paymentStatus === "PARTIAL";
  const existingRemainingAmount = existingPayment
    ? existingPayment.totalAmount - existingPayment.advanceAmount
    : 0;
  const [paymentData, setPaymentData] = useState({
    totalAmount: existingIsPartial
      ? existingRemainingAmount
      : equipment.payments?.[0]?.totalAmount || 0,
    advanceAmount: existingIsPartial
      ? existingRemainingAmount
      : equipment.payments?.[0]?.advanceAmount || 0,
    paymentMethod: (equipment.payments?.[0]?.paymentMethod ||
      "CASH") as PaymentMethod,
  });
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const availableStatuses = getAllStatuses(equipment.status, userRole);
  const canChangeStatus = availableStatuses.length > 0;
  const isCancelled = equipment.status === "CANCELLED";
  const isDelivered = equipment.status === "DELIVERED";

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Cargar técnicos
        const response = await apiFetch(
          "/api/tecnicos?status=ACTIVE&limit=100"
        );
        if (response.ok) {
          const data = await response.json();
          setTechnicians(data.technicians || []);
        }
      } catch (error) {
        console.error("Error cargando técnicos:", error);
      } finally {
        setIsLoadingTechnicians(false);
        // Simular mínimo de carga para mejor UX
        setTimeout(() => setIsInitialLoading(false), 300);
      }
    };
    fetchInitialData();
  }, []);

  // Cerrar modal con tecla ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Mostrar sección de pago cuando se selecciona DELIVERED
  useEffect(() => {
    setShowPaymentSection(selectedStatus === "DELIVERED");
  }, [selectedStatus]);

  // Guardar técnico asignado
  const handleSaveTechnician = async () => {
    setIsSavingTechnician(true);
    try {
      const response = await apiFetch(`/api/equipments/${equipment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedTechnicianId: selectedTechnicianId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al asignar técnico");
      }

      toast.success("Técnico actualizado correctamente");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al asignar técnico"
      );
    } finally {
      setIsSavingTechnician(false);
    }
  };

  // Guardar cambio de estado
  const handleSaveStatus = async () => {
    if (!selectedStatus) return;

    setIsSavingStatus(true);
    try {
      const response = await apiFetch(
        `/api/equipments/${equipment.id}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            equipmentId: equipment.id,
            newStatus: selectedStatus,
            observations: statusObservations || undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cambiar estado");
      }

      toast.success(
        `Estado actualizado a ${EQUIPMENT_STATUS_LABELS[selectedStatus]}`
      );
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al cambiar estado"
      );
    } finally {
      setIsSavingStatus(false);
    }
  };

  // Guardar pago
  const handleSavePayment = async () => {
    if (paymentData.totalAmount <= 0) {
      toast.error("El monto total debe ser mayor a 0");
      return;
    }

    setIsSavingPayment(true);
    try {
      // Si hay pago parcial existente, siempre crear NUEVO registro para el monto adicional
      // Esto permite que el ingreso se registre con la fecha de hoy
      const shouldCreateNew = !existingPayment || existingIsPartial;
      const url = shouldCreateNew
        ? "/api/payments"
        : `/api/payments/${existingPayment.id}`;
      const method = shouldCreateNew ? "POST" : "PUT";

      const response = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId: equipment.id,
          totalAmount: paymentData.totalAmount,
          advanceAmount: paymentData.advanceAmount,
          paymentMethod: paymentData.paymentMethod,
          voucherType: "RECEIPT",
          observations: existingIsPartial ? "Pago restante" : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar pago");
      }

      toast.success(
        existingIsPartial ? "Pago restante registrado" : existingPayment ? "Pago actualizado" : "Pago registrado"
      );
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al guardar pago"
      );
    } finally {
      setIsSavingPayment(false);
    }
  };

  // Revertir estado cancelado
  const handleRevertCancelled = useCallback(async () => {
    setIsSavingStatus(true);
    try {
      const response = await apiFetch(
        `/api/equipments/${equipment.id}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            equipmentId: equipment.id,
            newStatus: "RECEIVED",
            observations: "Servicio reactivado desde estado cancelado",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al revertir estado");
      }

      toast.success("Equipo reactivado correctamente");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al revertir estado"
      );
    } finally {
      setIsSavingStatus(false);
    }
  }, [equipment.id, onSuccess]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                {getTypeIcon(equipment.type)}
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-100">
                  Gestionar Equipo
                </h2>
                <p className="text-sm text-slate-400 font-mono">
                  {equipment.code}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all border border-red-500/30 hover:border-red-500/50"
              title="Cerrar (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Indicador de carga inicial */}
          {isInitialLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
              <p className="text-slate-400 text-sm">
                Cargando detalles del equipo...
              </p>
            </div>
          ) : (
            <>
              {/* Info del Equipo (Resumen) */}
              <div className="glass-dark p-4 rounded-xl border border-slate-600 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-200">
                    Información del Equipo
                  </h3>
                  <div className="flex items-center gap-2">
                    {onEdit && userRole === "ADMINISTRADOR" && (
                      <button
                        onClick={() => onEdit(equipment)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-blue-600/30 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar datos
                      </button>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        EQUIPMENT_STATUS_COLORS[equipment.status]
                      }`}
                    >
                      {EQUIPMENT_STATUS_LABELS[equipment.status]}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(equipment.type)}
                    <span className="text-slate-300">
                      {EQUIPMENT_TYPE_LABELS[equipment.type]}
                      {equipment.brand && ` - ${equipment.brand}`}
                      {equipment.model && ` ${equipment.model}`}
                    </span>
                  </div>
                  {equipment.customer && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-400" />
                      <span className="text-slate-300 truncate">
                        {equipment.customer.name}
                      </span>
                    </div>
                  )}
                </div>

                {equipment.customer && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Phone className="w-4 h-4" />
                    <span>+51 {formatPhone(equipment.customer.phone)}</span>
                  </div>
                )}

                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-500 text-xs">
                      Falla reportada:
                    </span>
                    <p className="text-slate-400">{equipment.reportedFlaw}</p>
                  </div>
                </div>

                {equipment.serviceType && (
                  <div className="flex items-start gap-2 text-sm">
                    <Wrench className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-500 text-xs">
                        Servicio a realizar:
                      </span>
                      <p className="text-slate-400">{equipment.serviceType}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>
                    Ingreso:{" "}
                    {new Date(equipment.entryDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Sección: Asignar Técnico */}
              {userRole === "ADMINISTRADOR" && (
                <div className="glass-dark p-4 rounded-xl border border-slate-600">
                  <h3 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-cyan-400" />
                    Asignar Técnico
                  </h3>
                  <div className="flex gap-2">
                    <select
                      value={selectedTechnicianId}
                      onChange={(e) => setSelectedTechnicianId(e.target.value)}
                      className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      disabled={isLoadingTechnicians}
                    >
                      <option value="">Sin asignar</option>
                      {technicians.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleSaveTechnician}
                      disabled={
                        isSavingTechnician ||
                        selectedTechnicianId ===
                          (equipment.assignedTechnicianId || "")
                      }
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      {isSavingTechnician ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {equipment.assignedTechnician && (
                    <p className="text-xs text-slate-400 mt-2">
                      Actualmente: {equipment.assignedTechnician.name}
                    </p>
                  )}
                </div>
              )}

              {/* Sección: Cambiar Estado */}
              {canChangeStatus && (
                <div className="glass-dark p-4 rounded-xl border border-slate-600">
                  <h3 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-yellow-400" />
                    Actualizar Estado
                  </h3>

                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {availableStatuses.map((status) => (
                        <button
                          key={status}
                          onClick={() => setSelectedStatus(status)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                            selectedStatus === status
                              ? EQUIPMENT_STATUS_COLORS[status]
                              : "bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500"
                          }`}
                        >
                          {EQUIPMENT_STATUS_LABELS[status]}
                        </button>
                      ))}
                    </div>

                    {selectedStatus && (
                      <>
                        <textarea
                          value={statusObservations}
                          onChange={(e) =>
                            setStatusObservations(e.target.value)
                          }
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-20"
                          placeholder="Observaciones (opcional)..."
                        />

                        <button
                          onClick={handleSaveStatus}
                          disabled={isSavingStatus}
                          className="w-full px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          {isSavingStatus ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <ChevronRight className="w-4 h-4" />
                              Cambiar a{" "}
                              {EQUIPMENT_STATUS_LABELS[selectedStatus]}
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Botón para revertir cancelado */}
              {isCancelled && userRole === "ADMINISTRADOR" && (
                <div className="glass-dark p-4 rounded-xl border border-red-600/30 bg-red-900/10">
                  <h3 className="text-sm font-medium text-red-300 mb-3 flex items-center gap-2">
                    <Undo2 className="w-4 h-4" />
                    Equipo Cancelado
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">
                    Este servicio fue cancelado. Puedes reactivarlo para volver
                    a procesarlo.
                  </p>
                  <button
                    onClick={handleRevertCancelled}
                    disabled={isSavingStatus}
                    className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isSavingStatus ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Undo2 className="w-4 h-4" />
                        Reactivar Servicio
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Sección: Pago (visible al seleccionar DELIVERED o si ya es DELIVERED) */}
              {(showPaymentSection || equipment.status === "DELIVERED") &&
                userRole === "ADMINISTRADOR" && (
                  <div className="glass-dark p-4 rounded-xl border border-emerald-600/30 bg-emerald-900/10">
                    <h3 className="text-sm font-medium text-emerald-300 mb-3 flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      {isDelivered
                        ? "Información de Pago"
                        : existingIsPartial
                        ? "Registrar Pago Restante"
                        : existingPayment
                        ? "Actualizar Pago"
                        : "Registrar Pago"}
                    </h3>

                    {existingIsPartial && !isDelivered && (
                      <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3 mb-3 text-sm">
                        <p className="text-yellow-400 font-medium mb-1">Pago parcial registrado</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                          <span>Total del servicio: <span className="text-slate-200">S/ {existingPayment?.totalAmount.toFixed(2)}</span></span>
                          <span>Adelanto pagado: <span className="text-emerald-400">S/ {existingPayment?.advanceAmount.toFixed(2)}</span></span>
                        </div>
                        <p className="text-yellow-300 text-xs mt-1">
                          Pendiente: S/ {existingRemainingAmount.toFixed(2)} — Este monto se registrará con la fecha de hoy
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          {existingIsPartial ? "Monto a Pagar (S/)" : "Monto Total (S/)"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={paymentData.totalAmount || ""}
                          onChange={(e) =>
                            setPaymentData((prev) => ({
                              ...prev,
                              totalAmount: parseFloat(e.target.value) || 0,
                            }))
                          }
                          disabled={isDelivered}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          {existingIsPartial ? "Monto que Paga (S/)" : "Monto Pagado (S/)"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          max={paymentData.totalAmount}
                          value={paymentData.advanceAmount || ""}
                          onChange={(e) =>
                            setPaymentData((prev) => ({
                              ...prev,
                              advanceAmount: parseFloat(e.target.value) || 0,
                            }))
                          }
                          disabled={isDelivered}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs text-slate-400 mb-1">
                        Método de Pago
                      </label>
                      <select
                        value={paymentData.paymentMethod}
                        onChange={(e) =>
                          setPaymentData((prev) => ({
                            ...prev,
                            paymentMethod: e.target.value as PaymentMethod,
                          }))
                        }
                        disabled={isDelivered}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {(
                          Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]
                        ).map((method) => (
                          <option key={method} value={method}>
                            {PAYMENT_METHOD_LABELS[method]}
                          </option>
                        ))}
                      </select>
                    </div>

                    {paymentData.totalAmount > 0 && (
                      <div className="bg-slate-700/50 rounded-lg p-3 mb-3 text-sm">
                        <div className="flex justify-between text-slate-400">
                          <span>Pendiente:</span>
                          <span
                            className={`font-medium ${
                              paymentData.advanceAmount >=
                              paymentData.totalAmount
                                ? "text-emerald-400"
                                : "text-yellow-400"
                            }`}
                          >
                            S/{" "}
                            {paymentData.totalAmount -
                              paymentData.advanceAmount <=
                            0
                              ? "0.00"
                              : (
                                  paymentData.totalAmount -
                                  paymentData.advanceAmount
                                ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {existingPayment && (
                      <div className="text-xs text-slate-400 mb-3">
                        Estado actual:{" "}
                        <span className="text-slate-300">
                          {PAYMENT_STATUS_LABELS[existingPayment.paymentStatus]}
                        </span>
                      </div>
                    )}

                    {!isDelivered && (
                      <button
                        onClick={handleSavePayment}
                        disabled={
                          isSavingPayment || paymentData.totalAmount <= 0
                        }
                        className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {isSavingPayment ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            {existingIsPartial
                              ? "Registrar Pago Restante"
                              : existingPayment
                              ? "Actualizar Pago"
                              : "Registrar Pago"}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

              {/* Historial de Pagos */}
              {equipment.payments && equipment.payments.length > 0 && (
                <div className="glass-dark p-4 rounded-xl border border-slate-600">
                  <h3 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-400" />
                    Historial de Pagos ({equipment.payments?.length ?? 0})
                  </h3>
                  <div className="space-y-3">
                    {equipment.payments?.map((payment, index) => (
                      <div
                        key={payment.id}
                        className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500">
                            Registro #
                            {(equipment.payments?.length ?? 0) - index}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              payment.paymentStatus === "COMPLETED"
                                ? "bg-green-600/20 text-green-400 border border-green-600/30"
                                : payment.paymentStatus === "PARTIAL"
                                ? "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30"
                                : "bg-red-600/20 text-red-400 border border-red-600/30"
                            }`}
                          >
                            {PAYMENT_STATUS_LABELS[payment.paymentStatus]}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                          <div>
                            <span className="text-slate-500 text-xs">
                              Total:
                            </span>
                            <p className="text-slate-200 font-medium">
                              S/ {payment.totalAmount.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500 text-xs">
                              Pagado:
                            </span>
                            <p className="text-emerald-400 font-medium">
                              S/ {payment.advanceAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {payment.remainingAmount > 0 && (
                          <div className="mb-2">
                            <span className="text-slate-500 text-xs">
                              Pendiente:
                            </span>
                            <p className="text-yellow-400 font-medium text-sm">
                              S/ {payment.remainingAmount.toFixed(2)}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-slate-400 border-t border-slate-600/50 pt-2 mt-2">
                          <span className="flex items-center gap-1">
                            <Banknote className="w-3 h-3" />
                            {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(payment.paymentDate).toLocaleDateString(
                              "es-PE",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-500 py-3 px-4 rounded-xl transition-all border border-red-500/30 hover:border-red-500/50"
          >
            Cerrar
          </button>
        </div>
      </div>

    </div>
  );
}
