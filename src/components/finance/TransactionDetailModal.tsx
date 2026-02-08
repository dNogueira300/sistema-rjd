// src/components/finance/TransactionDetailModal.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Eye,
  Pencil,
  Save,
  Loader2,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  CreditCard,
  FileText,
  User,
} from "lucide-react";
import ConfirmModal from "@/components/clients/ConfirmModal";
import type { ConsolidatedTransaction } from "@/types/finance";
import type { PaymentMethod } from "@/types/equipment";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/types/equipment";
import { EXPENSE_TYPE_LABELS } from "@/types/finance";

type ModalMode = "view" | "edit";

interface TransactionDetailModalProps {
  transaction: ConsolidatedTransaction;
  mode: ModalMode;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  isSaving?: boolean;
}

export default function TransactionDetailModal({
  transaction,
  mode: initialMode,
  onClose,
  onSave,
  isSaving = false,
}: TransactionDetailModalProps) {
  const [mode, setMode] = useState<ModalMode>(initialMode);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Estado de edición para INGRESO
  const [incomeData, setIncomeData] = useState({
    totalAmount: transaction.amount,
    advanceAmount: transaction.amount,
    paymentMethod: transaction.paymentMethod as PaymentMethod,
  });

  // Estado de edición para EGRESO
  const [expenseData, setExpenseData] = useState({
    description: transaction.description,
    amount: transaction.amount,
    beneficiary: transaction.beneficiary || "",
    paymentMethod: transaction.paymentMethod as PaymentMethod,
  });

  // Detectar cambios sin guardar
  const isDirty = useMemo(() => {
    if (mode !== "edit") return false;
    if (transaction.type === "INGRESO") {
      return (
        incomeData.totalAmount !== transaction.amount ||
        incomeData.advanceAmount !== transaction.amount ||
        incomeData.paymentMethod !== transaction.paymentMethod
      );
    } else {
      return (
        expenseData.description !== transaction.description ||
        expenseData.amount !== transaction.amount ||
        expenseData.beneficiary !== (transaction.beneficiary || "") ||
        expenseData.paymentMethod !== transaction.paymentMethod
      );
    }
  }, [mode, transaction, incomeData, expenseData]);

  // Verificar si la transacción es del día actual (America/Lima)
  const isToday = useMemo(() => {
    const now = new Date();
    const limaFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayLima = limaFormatter.format(now);
    const transactionDate = new Date(transaction.date);
    const transactionDateLima = limaFormatter.format(transactionDate);
    return todayLima === transactionDateLima;
  }, [transaction.date]);

  const handleCloseAttempt = useCallback(() => {
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Cerrar con tecla ESC
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving && !showConfirmClose) {
        handleCloseAttempt();
      }
    },
    [handleCloseAttempt, isSaving, showConfirmClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleSave = async () => {
    try {
      if (transaction.type === "INGRESO") {
        await onSave(incomeData);
      } else {
        await onSave(expenseData);
      }
    } catch {
      // Error handled by parent
    }
  };

  const isEditing = mode === "edit";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={isSaving ? undefined : handleCloseAttempt}
      />
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                transaction.type === "INGRESO"
                  ? "bg-green-600/20"
                  : "bg-red-600/20"
              }`}
            >
              {isEditing ? (
                <Pencil
                  className={`w-5 h-5 ${
                    transaction.type === "INGRESO"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                />
              ) : (
                <Eye
                  className={`w-5 h-5 ${
                    transaction.type === "INGRESO"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {isEditing ? "Editar" : "Detalle de"}{" "}
                {transaction.type === "INGRESO" ? "Ingreso" : "Egreso"}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? "Modifique los campos permitidos"
                  : "Información completa del registro"}
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseAttempt}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {/* Tipo y Fecha - siempre lectura */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                {transaction.type === "INGRESO" ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                Tipo
              </label>
              <p
                className={`text-sm font-semibold ${
                  transaction.type === "INGRESO"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {transaction.type}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Fecha
              </label>
              <p className="text-sm text-slate-200">
                {new Date(transaction.date).toLocaleDateString("es-PE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Descripción
            </label>
            {isEditing && transaction.type === "EGRESO" ? (
              <input
                type="text"
                value={expenseData.description}
                onChange={(e) =>
                  setExpenseData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="input-dark w-full text-sm"
              />
            ) : (
              <p className="text-sm text-slate-200">
                {transaction.description}
              </p>
            )}
          </div>

          {/* Monto */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              {transaction.type === "INGRESO" ? "Monto Total" : "Monto"}
            </label>
            {isEditing ? (
              transaction.type === "INGRESO" ? (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={incomeData.totalAmount}
                  onChange={(e) =>
                    setIncomeData((prev) => ({
                      ...prev,
                      totalAmount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="input-dark w-full text-sm"
                />
              ) : (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={expenseData.amount}
                  onChange={(e) =>
                    setExpenseData((prev) => ({
                      ...prev,
                      amount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="input-dark w-full text-sm"
                />
              )
            ) : (
              <p className="text-sm font-semibold text-slate-200">
                S/ {transaction.amount.toFixed(2)}
              </p>
            )}
          </div>

          {/* Adelanto (solo INGRESO) */}
          {transaction.type === "INGRESO" && (
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                Monto Adelanto
              </label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={incomeData.advanceAmount}
                  onChange={(e) =>
                    setIncomeData((prev) => ({
                      ...prev,
                      advanceAmount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="input-dark w-full text-sm"
                />
              ) : (
                <p className="text-sm text-slate-200">
                  S/ {transaction.amount.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Receptor / Beneficiario */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Receptor
            </label>
            {isEditing && transaction.type === "EGRESO" ? (
              <input
                type="text"
                value={expenseData.beneficiary}
                onChange={(e) =>
                  setExpenseData((prev) => ({
                    ...prev,
                    beneficiary: e.target.value,
                  }))
                }
                className="input-dark w-full text-sm"
              />
            ) : (
              <p className="text-sm text-slate-200">
                {transaction.beneficiary || "-"}
              </p>
            )}
          </div>

          {/* Método de pago */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              Método de Pago
            </label>
            {isEditing ? (
              <select
                value={
                  transaction.type === "INGRESO"
                    ? incomeData.paymentMethod
                    : expenseData.paymentMethod
                }
                onChange={(e) => {
                  const value = e.target.value as PaymentMethod;
                  if (transaction.type === "INGRESO") {
                    setIncomeData((prev) => ({
                      ...prev,
                      paymentMethod: value,
                    }));
                  } else {
                    setExpenseData((prev) => ({
                      ...prev,
                      paymentMethod: value,
                    }));
                  }
                }}
                className="input-dark w-full text-sm"
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-slate-200">
                {PAYMENT_METHOD_LABELS[transaction.paymentMethod]}
              </p>
            )}
          </div>

          {/* Estado/Categoría - solo lectura */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1">
              {transaction.type === "INGRESO" ? "Estado de Pago" : "Categoría"}
            </label>
            <p className="text-sm text-slate-200">
              {transaction.type === "INGRESO" && transaction.paymentStatus
                ? PAYMENT_STATUS_LABELS[transaction.paymentStatus]
                : transaction.expenseType
                  ? EXPENSE_TYPE_LABELS[transaction.expenseType]
                  : "-"}
            </p>
          </div>

          {/* Código de equipo (solo INGRESO) */}
          {transaction.equipmentCode && (
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1">
                Equipo
              </label>
              <p className="text-sm text-slate-200">
                {transaction.equipmentCode}
              </p>
            </div>
          )}

          {/* Tipo de comprobante (solo INGRESO) */}
          {transaction.voucherType && (
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1">
                Tipo de Comprobante
              </label>
              <p className="text-sm text-slate-200">
                {transaction.voucherType === "RECEIPT"
                  ? "Boleta"
                  : transaction.voucherType === "INVOICE"
                    ? "Factura"
                    : "Nota de Entrega"}
              </p>
            </div>
          )}

          {/* Observaciones - solo lectura */}
          {transaction.observations && (
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1">
                Observaciones
              </label>
              <p className="text-sm text-slate-200 italic">
                {transaction.observations}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 md:p-6 border-t border-slate-700 shrink-0">
          {mode === "view" ? (
            <>
              <button
                onClick={onClose}
                className="btn-secondary-dark px-4 py-2 text-sm"
              >
                Cerrar
              </button>
              {isToday ? (
                <button
                  onClick={() => setMode("edit")}
                  className="btn-primary-dark flex items-center gap-2 px-4 py-2 text-sm"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
              ) : (
                <span className="text-xs text-slate-500 italic">
                  Solo se pueden editar registros del día actual
                </span>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => setMode("view")}
                disabled={isSaving}
                className="btn-secondary-dark px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary-dark flex items-center gap-2 px-4 py-2 text-sm"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal de confirmación para cerrar sin guardar */}
      <ConfirmModal
        isOpen={showConfirmClose}
        title="Cambios sin guardar"
        message="Tienes cambios sin guardar. ¿Deseas salir sin guardar?"
        confirmLabel="Salir sin guardar"
        cancelLabel="Seguir editando"
        confirmButtonColor="red"
        onConfirm={onClose}
        onCancel={() => setShowConfirmClose(false)}
      />
    </div>
  );
}
