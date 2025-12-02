// src/components/reports/TechnicianPaymentsTable.tsx
"use client";

import { useTechnicianPayments } from "@/hooks/useReports";
import { DollarSign, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/reports";
import { PAYMENT_METHOD_LABELS } from "@/types/equipment";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PAYMENT_TYPE_LABELS = {
  ADVANCE: "Adelanto",
  SALARY: "Salario",
};

const PAYMENT_TYPE_COLORS = {
  ADVANCE: "bg-orange-600/20 text-orange-400 border-orange-600/30",
  SALARY: "bg-blue-600/20 text-blue-400 border-blue-600/30",
};

interface TechnicianPaymentsTableProps {
  startDate?: string;
  endDate?: string;
  technicianId?: string;
}

export default function TechnicianPaymentsTable({
  startDate,
  endDate,
  technicianId,
}: TechnicianPaymentsTableProps) {
  const { data, isLoading, error } = useTechnicianPayments({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    technicianId: technicianId || undefined,
  });

  if (error) {
    return (
      <div className="card-dark p-6 border-2 border-red-500/30">
        <p className="text-red-400">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="card-dark p-6 border-2 border-slate-700">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-linear-to-br from-orange-600 to-orange-700">
          <DollarSign className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-100">
            Pagos a Técnicos (Detallado)
          </h3>
          <p className="text-sm text-slate-400">
            Adelantos y salarios registrados
          </p>
        </div>
      </div>

      {/* Métricas Resumen */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card-dark p-4 border-2 border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-purple-400" />
              <p className="text-sm text-slate-400">Total Pagos</p>
            </div>
            <p className="text-2xl font-bold text-slate-100">
              {formatCurrency(data.totalAmount)}
            </p>
          </div>

          <div className="card-dark p-4 border-2 border-orange-600/30 bg-orange-600/5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-orange-400" />
              <p className="text-sm text-slate-400">Adelantos</p>
            </div>
            <p className="text-2xl font-bold text-orange-400">
              {formatCurrency(data.totalAdvances)}
            </p>
          </div>

          <div className="card-dark p-4 border-2 border-blue-600/30 bg-blue-600/5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-blue-400" />
              <p className="text-sm text-slate-400">Salarios</p>
            </div>
            <p className="text-2xl font-bold text-blue-400">
              {formatCurrency(data.totalSalaries)}
            </p>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Cargando pagos...</p>
            </div>
          </div>
        ) : data && data.payments.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                  Fecha
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                  Técnico
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                  Tipo
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                  Descripción
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                  Método
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">
                  Monto
                </th>
              </tr>
            </thead>
            <tbody>
              {data.payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-slate-100">
                    {format(new Date(payment.date), "dd/MM/yyyy", {
                      locale: es,
                    })}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-slate-100">
                    {payment.technicianName}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${
                        PAYMENT_TYPE_COLORS[payment.type]
                      }`}
                    >
                      {PAYMENT_TYPE_LABELS[payment.type]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300 max-w-xs truncate">
                    {payment.description}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300">
                    {
                      PAYMENT_METHOD_LABELS[
                        payment.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS
                      ]
                    }
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-bold text-red-400">
                    {formatCurrency(payment.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Fila de totales */}
            <tfoot className="border-t-2 border-slate-600 bg-slate-700/30">
              <tr>
                <td
                  colSpan={5}
                  className="py-3 px-4 text-sm font-bold text-slate-100"
                >
                  TOTAL
                </td>
                <td className="py-3 px-4 text-right text-sm font-bold text-red-400">
                  {formatCurrency(data.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400">
              No hay pagos registrados con los filtros seleccionados
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
