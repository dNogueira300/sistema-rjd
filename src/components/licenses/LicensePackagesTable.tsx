// src/components/licenses/LicensePackagesTable.tsx
"use client";

import { Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { LicensePackage, PackageStockStatus } from "@/types/license";

interface LicensePackagesTableProps {
  packages: LicensePackage[];
  onEdit: (pkg: LicensePackage) => void;
  onDelete: (pkg: LicensePackage) => void;
}

const statusBadge: Record<PackageStockStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Activo", className: "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30" },
  LOW: { label: "Stock bajo", className: "bg-amber-600/20 text-amber-400 border border-amber-600/30" },
  DEPLETED: { label: "Agotado", className: "bg-red-600/20 text-red-400 border border-red-600/30" },
};

export default function LicensePackagesTable({ packages, onEdit, onDelete }: LicensePackagesTableProps) {
  if (packages.length === 0) {
    return <p className="text-slate-400 text-center py-8">No hay paquetes registrados.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400 border-b border-slate-700">
            <th className="py-3 px-3">Código</th>
            <th className="py-3 px-3">Proveedor</th>
            <th className="py-3 px-3 text-center">Total</th>
            <th className="py-3 px-3 text-center">Usadas</th>
            <th className="py-3 px-3 text-center">Restantes</th>
            <th className="py-3 px-3">Estado</th>
            <th className="py-3 px-3">Compra</th>
            <th className="py-3 px-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => {
            const badge = statusBadge[pkg.stockStatus];
            return (
              <tr key={pkg.id} className="border-b border-slate-800 text-slate-200">
                <td className="py-3 px-3 font-mono text-xs">{pkg.code}</td>
                <td className="py-3 px-3">{pkg.provider || "-"}</td>
                <td className="py-3 px-3 text-center">{pkg.totalLicenses}</td>
                <td className="py-3 px-3 text-center">{pkg.usedLicenses}</td>
                <td className="py-3 px-3 text-center font-semibold">{pkg.remainingLicenses}</td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>{badge.label}</span>
                </td>
                <td className="py-3 px-3">{formatDate(pkg.purchaseDate)}</td>
                <td className="py-3 px-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => onEdit(pkg)} className="p-2 rounded-lg hover:bg-slate-700 text-blue-400" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(pkg)} className="p-2 rounded-lg hover:bg-slate-700 text-red-400" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
