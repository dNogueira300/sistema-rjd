// src/components/licenses/LicenseActivationsTable.tsx
"use client";

import { Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { LicenseActivation } from "@/types/license";

interface LicenseActivationsTableProps {
  activations: LicenseActivation[];
  onEdit: (activation: LicenseActivation) => void;
  onDelete: (activation: LicenseActivation) => void;
}

export default function LicenseActivationsTable({ activations, onEdit, onDelete }: LicenseActivationsTableProps) {
  if (activations.length === 0) {
    return <p className="text-slate-400 text-center py-8">No hay activaciones registradas.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400 border-b border-slate-700">
            <th className="py-3 px-3">Fecha</th>
            <th className="py-3 px-3">Técnico</th>
            <th className="py-3 px-3">Cliente</th>
            <th className="py-3 px-3">Clave</th>
            <th className="py-3 px-3">Soporte</th>
            <th className="py-3 px-3">Paquete</th>
            <th className="py-3 px-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {activations.map((a) => (
            <tr key={a.id} className="border-b border-slate-800 text-slate-200">
              <td className="py-3 px-3 whitespace-nowrap">{formatDate(a.activationDate)}</td>
              <td className="py-3 px-3">{a.technician.name}</td>
              <td className="py-3 px-3">{a.customer.name}</td>
              <td className="py-3 px-3 font-mono text-xs">{a.licenseKey}</td>
              <td className="py-3 px-3 max-w-52 truncate" title={a.support}>{a.support}</td>
              <td className="py-3 px-3 font-mono text-xs">{a.package.code}</td>
              <td className="py-3 px-3">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => onEdit(a)} className="p-2 rounded-lg hover:bg-slate-700 text-blue-400" title="Editar">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(a)} className="p-2 rounded-lg hover:bg-slate-700 text-red-400" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
