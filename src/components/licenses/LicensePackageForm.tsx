// src/components/licenses/LicensePackageForm.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { Calendar, Hash, Building2, FileText, X } from "lucide-react";
import {
  createLicensePackageSchema,
  updateLicensePackageSchema,
} from "@/lib/validations/license";
import type {
  LicensePackage,
  CreateLicensePackageData,
} from "@/types/license";

interface LicensePackageFormProps {
  package?: LicensePackage | null;
  onSubmit: (data: CreateLicensePackageData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function toDateInput(iso: string): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

export default function LicensePackageForm({
  package: pkg,
  onSubmit,
  onCancel,
  isLoading = false,
}: LicensePackageFormProps) {
  const isEditing = !!pkg;
  const formKey = pkg ? pkg.id : "new";

  const [formData, setFormData] = useState<CreateLicensePackageData>(() => ({
    provider: pkg?.provider ?? "",
    totalLicenses: pkg?.totalLicenses ?? 10,
    purchaseDate: pkg ? toDateInput(pkg.purchaseDate) : toDateInput(new Date().toISOString()),
    observations: pkg?.observations ?? "",
  }));
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = useMemo<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    try {
      const schema = isEditing ? updateLicensePackageSchema : createLicensePackageSchema;
      schema.parse(formData);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "issues" in error) {
        const zodError = error as { issues: Array<{ path: (string | number)[]; message: string }> };
        zodError.issues.forEach((err) => {
          const field = err.path[0];
          if (typeof field === "string" && touched[field]) result[field] = err.message;
        });
      }
      return result;
    }
    return result;
  }, [formData, touched, isEditing]);

  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setTouched({ provider: true, totalLicenses: true, purchaseDate: true, observations: true });
      try {
        const schema = isEditing ? updateLicensePackageSchema : createLicensePackageSchema;
        schema.parse(formData);
        onSubmit({
          ...formData,
          purchaseDate: new Date(`${formData.purchaseDate}T12:00:00.000Z`).toISOString(),
        });
      } catch (error) {
        console.error("Error de validación:", error);
      }
    },
    [formData, isEditing, onSubmit]
  );

  const isValid = Object.keys(errors).length === 0 && formData.totalLicenses >= 1 && !!formData.purchaseDate;

  return (
    <div key={formKey} className="card-dark-strong p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-2xl font-bold text-slate-100">
          {isEditing ? "Editar Paquete" : "Nuevo Paquete"}
        </h2>
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200" disabled={isLoading}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <Hash className="w-4 h-4 text-blue-400" /> Cantidad de licencias *
          </label>
          <input
            type="number"
            min={1}
            value={formData.totalLicenses}
            onChange={(e) => setFormData((p) => ({ ...p, totalLicenses: Number(e.target.value) }))}
            onBlur={() => handleBlur("totalLicenses")}
            className={`input-dark w-full ${errors.totalLicenses ? "border-red-500" : ""}`}
            disabled={isLoading || isEditing && (pkg?.usedLicenses ?? 0) > 0}
            required
          />
          {isEditing && (pkg?.usedLicenses ?? 0) > 0 && (
            <p className="text-slate-400 text-xs mt-1">No se puede reducir por debajo de las {pkg?.usedLicenses} ya usadas.</p>
          )}
          {errors.totalLicenses && <p className="text-red-400 text-xs mt-1">{errors.totalLicenses}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-green-400" /> Fecha de compra *
          </label>
          <input
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData((p) => ({ ...p, purchaseDate: e.target.value }))}
            onBlur={() => handleBlur("purchaseDate")}
            className={`input-dark w-full ${errors.purchaseDate ? "border-red-500" : ""}`}
            disabled={isLoading}
            required
          />
          {errors.purchaseDate && <p className="text-red-400 text-xs mt-1">{errors.purchaseDate}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-yellow-400" /> Proveedor
          </label>
          <input
            type="text"
            value={formData.provider ?? ""}
            onChange={(e) => setFormData((p) => ({ ...p, provider: e.target.value }))}
            className="input-dark w-full"
            placeholder="Ej: Distribuidor ESET"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-400" /> Observaciones
          </label>
          <textarea
            value={formData.observations ?? ""}
            onChange={(e) => setFormData((p) => ({ ...p, observations: e.target.value }))}
            className="input-dark w-full min-h-20"
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-4 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 py-3 px-4 rounded-xl disabled:opacity-50" disabled={isLoading}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary-dark flex-1 py-3 px-4 rounded-xl disabled:opacity-50" disabled={isLoading || !isValid}>
            {isLoading ? "Guardando..." : isEditing ? "Actualizar Paquete" : "Registrar Paquete"}
          </button>
        </div>
      </form>
    </div>
  );
}
