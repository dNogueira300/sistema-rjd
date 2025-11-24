// src/components/equipment/EquipmentManageModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, User, Banknote, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { Equipment, PaymentMethod } from "@/types/equipment";
import { PAYMENT_METHOD_LABELS } from "@/types/equipment";

interface Technician {
  id: string;
  name: string;
  email: string;
}

interface EquipmentManageModalProps {
  equipment: Equipment;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EquipmentManageModal({
  equipment,
  onClose,
  onSuccess,
}: EquipmentManageModalProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>(
    equipment.assignedTechnicianId || ""
  );
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(true);
  const [isSavingTechnician, setIsSavingTechnician] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Estado para pago
  const [paymentData, setPaymentData] = useState({
    totalAmount: equipment.payments?.[0]?.totalAmount || 0,
    advanceAmount: equipment.payments?.[0]?.advanceAmount || 0,
    paymentMethod: (equipment.payments?.[0]?.paymentMethod || "CASH") as PaymentMethod,
  });
  const existingPayment = equipment.payments?.[0];

  // Cargar técnicos
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const response = await apiFetch("/api/tecnicos?status=ACTIVE");
        if (response.ok) {
          const data = await response.json();
          setTechnicians(data.technicians || []);
        }
      } catch (error) {
        console.error("Error cargando técnicos:", error);
      } finally {
        setIsLoadingTechnicians(false);
      }
    };
    fetchTechnicians();
  }, []);

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

      toast.success("Técnico asignado correctamente");
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al asignar técnico");
    } finally {
      setIsSavingTechnician(false);
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
      const url = existingPayment
        ? `/api/payments/${existingPayment.id}`
        : "/api/payments";
      const method = existingPayment ? "PUT" : "POST";

      const response = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId: equipment.id,
          totalAmount: paymentData.totalAmount,
          advanceAmount: paymentData.advanceAmount,
          paymentMethod: paymentData.paymentMethod,
          voucherType: "RECEIPT",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar pago");
      }

      toast.success(existingPayment ? "Pago actualizado" : "Pago registrado");
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar pago");
    } finally {
      setIsSavingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-100">
                Gestionar Equipo
              </h2>
              <p className="text-sm text-slate-400 font-mono mt-1">
                {equipment.code}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Asignar Técnico */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              Asignar Técnico
            </h3>
            <div className="flex gap-2">
              <select
                value={selectedTechnicianId}
                onChange={(e) => setSelectedTechnicianId(e.target.value)}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                disabled={isSavingTechnician || selectedTechnicianId === (equipment.assignedTechnicianId || "")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {isSavingTechnician ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </button>
            </div>
            {equipment.assignedTechnician && (
              <p className="text-xs text-slate-400">
                Actualmente asignado a: {equipment.assignedTechnician.name}
              </p>
            )}
          </div>

          {/* Registrar/Editar Pago */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-400" />
              {existingPayment ? "Editar Pago" : "Registrar Pago"}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Monto Total (S/)
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
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Adelanto (S/)
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
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
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
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
                  (method) => (
                    <option key={method} value={method}>
                      {PAYMENT_METHOD_LABELS[method]}
                    </option>
                  )
                )}
              </select>
            </div>

            {paymentData.totalAmount > 0 && (
              <div className="bg-slate-700/50 rounded-lg p-3 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Pendiente:</span>
                  <span className="text-slate-200 font-medium">
                    S/ {Math.max(0, paymentData.totalAmount - paymentData.advanceAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleSavePayment}
              disabled={isSavingPayment || paymentData.totalAmount <= 0}
              className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSavingPayment ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {existingPayment ? "Actualizar Pago" : "Registrar Pago"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 py-3 px-4 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
