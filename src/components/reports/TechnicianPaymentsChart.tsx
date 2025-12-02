// src/components/reports/TechnicianPaymentsChart.tsx
"use client";

import { useTechnicianPayments } from "@/hooks/useReports";
import { BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/reports";

interface TechnicianPaymentsChartProps {
  startDate?: string;
  endDate?: string;
  technicianId?: string;
}

export default function TechnicianPaymentsChart({
  startDate,
  endDate,
  technicianId,
}: TechnicianPaymentsChartProps) {
  const { data, isLoading, error } = useTechnicianPayments({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    technicianId: technicianId || undefined,
  });

  // Agrupar pagos por técnico
  const technicianTotals = data?.payments.reduce((acc, payment) => {
    const techName = payment.technicianName;
    if (!acc[techName]) {
      acc[techName] = 0;
    }
    acc[techName] += payment.amount;
    return acc;
  }, {} as Record<string, number>);

  // Convertir a array y ordenar por monto descendente
  const chartData = technicianTotals
    ? Object.entries(technicianTotals)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
    : [];

  // Calcular el monto máximo para escalar las barras
  const maxAmount = chartData.length > 0 ? chartData[0].amount : 0;

  if (error) {
    return (
      <div className="card-dark p-6 border-2 border-red-500/30">
        <p className="text-red-400">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="card-dark p-6 border-2 border-slate-700 h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-linear-to-br from-blue-600 to-blue-700">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-100">
            Total por Técnico
          </h3>
          <p className="text-sm text-slate-400">Suma de adelantos y salarios</p>
        </div>
      </div>

      {/* Gráfico */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Cargando datos...</p>
          </div>
        </div>
      ) : chartData.length > 0 ? (
        <div className="space-y-4">
          {chartData.map((tech, index) => {
            const percentage =
              maxAmount > 0 ? (tech.amount / maxAmount) * 100 : 0;
            // Colores diferentes para cada técnico
            const colors = [
              { from: "from-blue-600", to: "to-blue-500" },
              { from: "from-green-600", to: "to-green-500" },
              { from: "from-purple-600", to: "to-purple-500" },
              { from: "from-orange-600", to: "to-orange-500" },
              { from: "from-pink-600", to: "to-pink-500" },
              { from: "from-cyan-600", to: "to-cyan-500" },
              { from: "from-yellow-600", to: "to-yellow-500" },
              { from: "from-red-600", to: "to-red-500" },
            ];
            const color = colors[index % colors.length];
            return (
              <div key={tech.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-100">
                    {tech.name}
                  </span>
                  <span className="text-sm font-bold text-slate-100">
                    {formatCurrency(tech.amount)}
                  </span>
                </div>
                <div className="relative w-full h-8 bg-slate-700/50 rounded-lg overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full bg-linear-to-r ${color.from} ${color.to} transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-400">
            No hay datos de pagos con los filtros seleccionados
          </p>
        </div>
      )}
    </div>
  );
}
