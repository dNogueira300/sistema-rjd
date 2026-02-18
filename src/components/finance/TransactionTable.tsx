// src/components/finance/TransactionTable.tsx
"use client";

import { TrendingUp, TrendingDown, Calendar, DollarSign, Settings } from "lucide-react";
import type { ConsolidatedTransaction } from "@/types/finance";
import {
  TRANSACTION_TYPE_COLORS,
  EXPENSE_TYPE_LABELS,
} from "@/types/finance";
import {
  PAYMENT_METHOD_LABELS,
} from "@/types/equipment";

// Labels descriptivos para el estado de pago en finanzas
const getPaymentStatusDisplay = (transaction: ConsolidatedTransaction) => {
  if (!transaction.paymentStatus) return { label: "-", color: "text-slate-300" };

  const isRemainingPayment = transaction.observations === "Pago restante";

  if (isRemainingPayment) {
    return { label: "Pago restante", color: "text-emerald-400" };
  }

  switch (transaction.paymentStatus) {
    case "PARTIAL":
      return { label: "Adelanto", color: "text-yellow-400" };
    case "COMPLETED":
      return { label: "Pagado", color: "text-emerald-400" };
    case "PENDING":
      return { label: "Pendiente", color: "text-red-400" };
    default:
      return { label: transaction.paymentStatus, color: "text-slate-300" };
  }
};

interface TransactionTableProps {
  transactions: ConsolidatedTransaction[];
  isLoading?: boolean;
  onManage?: (transaction: ConsolidatedTransaction) => void;
}

export default function TransactionTable({
  transactions,
  isLoading = false,
  onManage,
}: TransactionTableProps) {
  if (isLoading) {
    return (
      <div className="card-dark p-8 md:p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-slate-400">Cargando transacciones...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="card-dark p-8 md:p-12 text-center">
        <DollarSign className="w-12 h-12 md:w-16 md:h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg md:text-xl font-semibold text-slate-300 mb-2">
          No se encontraron transacciones
        </h3>
        <p className="text-slate-400 mb-6 text-sm md:text-base">
          No hay transacciones que coincidan con los filtros.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: Card View */}
      <div className="md:hidden space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="card-dark p-4 hover-lift border border-slate-700"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                  TRANSACTION_TYPE_COLORS[transaction.type]
                }`}
              >
                {transaction.type === "INGRESO" ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {transaction.type}
              </div>
              <span className="text-sm text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(transaction.date).toLocaleDateString()}
              </span>
            </div>

            <p className="text-slate-200 font-medium mb-1">
              {transaction.description}
            </p>
            {transaction.equipmentServiceType && (
              <p className="text-xs text-slate-400 mb-2">
                {transaction.equipmentServiceType}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-400">Monto:</span>
                <p className="text-slate-200 font-semibold">
                  S/ {transaction.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Receptor:</span>
                <p className="text-slate-200">
                  {transaction.beneficiary || "-"}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Método:</span>
                <p className="text-slate-200">
                  {PAYMENT_METHOD_LABELS[transaction.paymentMethod]}
                </p>
              </div>
              <div>
                <span className="text-slate-400">
                  {transaction.type === "INGRESO" ? "Estado:" : "Categoría:"}
                </span>
                {transaction.type === "INGRESO" ? (
                  <p className={`font-medium ${getPaymentStatusDisplay(transaction).color}`}>
                    {getPaymentStatusDisplay(transaction).label}
                  </p>
                ) : (
                  <p className="text-slate-200">
                    {transaction.expenseType
                      ? EXPENSE_TYPE_LABELS[transaction.expenseType]
                      : "-"}
                  </p>
                )}
              </div>
            </div>

            {transaction.observations && (
              <p className="text-slate-400 text-xs mt-2 italic">
                {transaction.observations}
              </p>
            )}

            {/* Acciones mobile */}
            {onManage && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700">
                <button
                  onClick={() => onManage(transaction)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-400 bg-blue-600/10 border border-blue-600/30 rounded-lg hover:bg-blue-600/20 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Gestionar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr>
                <th className="px-4 lg:px-6 py-4 text-left">
                  <div className="font-semibold text-slate-200">Fecha</div>
                </th>
                <th className="px-4 lg:px-6 py-4 text-left">
                  <div className="font-semibold text-slate-200">Tipo</div>
                </th>
                <th className="px-4 lg:px-6 py-4 text-left">
                  <div className="font-semibold text-slate-200">Descripción</div>
                </th>
                <th className="px-4 lg:px-6 py-4 text-left">
                  <div className="font-semibold text-slate-200">Receptor</div>
                </th>
                <th className="px-4 lg:px-6 py-4 text-right">
                  <div className="font-semibold text-slate-200">Monto</div>
                </th>
                <th className="px-4 lg:px-6 py-4 text-left">
                  <div className="font-semibold text-slate-200">Método</div>
                </th>
                <th className="px-4 lg:px-6 py-4 text-left">
                  <div className="font-semibold text-slate-200">
                    Estado/Categoría
                  </div>
                </th>
                {onManage && (
                  <th className="px-4 lg:px-6 py-4 text-center">
                    <div className="font-semibold text-slate-200">Acciones</div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 lg:px-6 py-4">
                    <span className="text-sm text-slate-300">
                      {new Date(transaction.date).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        TRANSACTION_TYPE_COLORS[transaction.type]
                      }`}
                    >
                      {transaction.type === "INGRESO" ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <p className="text-sm font-medium text-slate-200">
                      {transaction.description}
                    </p>
                    {transaction.equipmentServiceType && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {transaction.equipmentServiceType}
                      </p>
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <span className="text-sm text-slate-300">
                      {transaction.beneficiary || "-"}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-slate-200">
                      S/ {transaction.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <span className="text-sm text-slate-300">
                      {PAYMENT_METHOD_LABELS[transaction.paymentMethod]}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    {transaction.type === "INGRESO" ? (
                      <span className={`text-sm font-medium ${getPaymentStatusDisplay(transaction).color}`}>
                        {getPaymentStatusDisplay(transaction).label}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-300">
                        {transaction.expenseType
                          ? EXPENSE_TYPE_LABELS[transaction.expenseType]
                          : "-"}
                      </span>
                    )}
                  </td>
                  {onManage && (
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => onManage(transaction)}
                          className="p-2 rounded-lg text-blue-400 hover:bg-blue-600/20 transition-colors"
                          title="Gestionar"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
