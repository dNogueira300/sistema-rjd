// src/components/reports/TechnicianTable.tsx
"use client";

import type { TechnicianPerformance } from "@/types/reports";
import { formatCurrency } from "@/lib/reports";
import { User, CheckCircle, Clock, DollarSign } from "lucide-react";

interface TechnicianTableProps {
  data: TechnicianPerformance[];
  title?: string;
}

export default function TechnicianTable({ data, title }: TechnicianTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card-dark p-6 border-2 border-slate-700">
        {title && <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>}
        <p className="text-slate-400 text-center py-8">No hay datos de técnicos disponibles</p>
      </div>
    );
  }

  return (
    <div className="card-dark p-6 border-2 border-slate-700">
      {title && <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Técnico
                </div>
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-slate-300">
                Asignados
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-slate-300">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Completados
                </div>
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-slate-300">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  Promedio Días
                </div>
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">
                <div className="flex items-center justify-end gap-2">
                  <DollarSign className="w-4 h-4" />
                  Facturación
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((tech) => {
              const completionRate = tech.assignedCount > 0
                ? (tech.completedCount / tech.assignedCount) * 100
                : 0;

              return (
                <tr
                  key={tech.technicianId}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-slate-100">{tech.technicianName}</p>
                    <p className="text-xs text-slate-500">
                      {completionRate.toFixed(0)}% completado
                    </p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-sm text-slate-300">{tech.assignedCount}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600/20 text-green-400">
                      {tech.completedCount}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-sm text-slate-300">
                      {tech.averageDays > 0 ? `${tech.averageDays} días` : "-"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-medium text-slate-100">
                      {formatCurrency(tech.revenue)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
