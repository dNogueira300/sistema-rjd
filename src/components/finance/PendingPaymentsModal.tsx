"use client";

import { useEffect, useCallback, useState } from "react";
import { X, Clock, Calendar, DollarSign } from "lucide-react";
import type { ConsolidatedTransaction } from "@/types/finance";
import { PAYMENT_METHOD_LABELS } from "@/types/equipment";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PendingPaymentsModal({ isOpen, onClose }: Props) {
  const [payments, setPayments] = useState<ConsolidatedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/transactions/pending");
      const data = res.ok ? await res.json() : { transactions: [] };
      const combined: ConsolidatedTransaction[] = data.transactions || [];
      // Ordenar por fecha ascendente
      combined.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      setPayments(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  // Cerrar con ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-600/20">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Pagos pendientes
              </h2>
              <p className="text-xs text-slate-400">
                Mostrando {payments.length} registros pendientes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="text-center text-slate-400">Cargando...</div>
          ) : payments.length === 0 ? (
            <div className="text-center text-slate-400">
              No se encontraron pagos pendientes.
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="card-dark p-3 rounded-lg border border-slate-700"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-200 font-medium">
                        {p.description}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Equipo: {p.equipmentCode || "-"}
                      </p>
                      <p className="text-xs text-slate-400">
                        Método: {PAYMENT_METHOD_LABELS[p.paymentMethod]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-200">
                        S/ {p.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(p.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-slate-100 py-2 px-4 rounded-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
