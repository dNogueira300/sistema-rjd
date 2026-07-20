// src/components/licenses/LicenseFilters.tsx
"use client";

import { Filter, X } from "lucide-react";
import type { LicenseActivationFilters, LicensePackage } from "@/types/license";
import SingleDatePicker from "@/components/licenses/SingleDatePicker";
import ClientSearchSelect from "@/components/licenses/ClientSearchSelect";

interface Option {
  id: string;
  name: string;
}

interface LicenseFiltersProps {
  filters: LicenseActivationFilters;
  packages: LicensePackage[];
  technicians: Option[];
  onChange: (filters: LicenseActivationFilters) => void;
  onReset: () => void;
}

export default function LicenseFilters({
  filters,
  packages,
  technicians,
  onChange,
  onReset,
}: LicenseFiltersProps) {
  const update = (patch: Partial<LicenseActivationFilters>) =>
    onChange({ ...filters, ...patch });

  return (
    <div className="card-dark-strong p-4 mb-4">
      <div className="flex items-center gap-2 mb-3 text-slate-200">
        <Filter className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium">Filtros</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Desde</label>
          <SingleDatePicker
            value={filters.from ? filters.from.slice(0, 10) : ""}
            onChange={(v) =>
              update({ from: v ? `${v}T00:00:00.000Z` : undefined })
            }
            placeholder="Desde"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Hasta</label>
          <SingleDatePicker
            value={filters.to ? filters.to.slice(0, 10) : ""}
            onChange={(v) =>
              update({ to: v ? `${v}T23:59:59.999Z` : undefined })
            }
            placeholder="Hasta"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Técnico</label>
          <select
            value={filters.technicianId ?? ""}
            onChange={(e) =>
              update({ technicianId: e.target.value || undefined })
            }
            className="input-dark w-full"
          >
            <option value="">Todos</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Cliente</label>
          <ClientSearchSelect
            value={filters.customerId ?? ""}
            onChange={(id) => update({ customerId: id || undefined })}
            placeholder="Todos"
            allowClear
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Paquete</label>
          <select
            value={filters.packageId ?? ""}
            onChange={(e) => update({ packageId: e.target.value || undefined })}
            className="input-dark w-full"
          >
            <option value="">Todos</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end mt-3">
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg hover:bg-slate-700"
        >
          <X className="w-4 h-4" /> Limpiar filtros
        </button>
      </div>
    </div>
  );
}
