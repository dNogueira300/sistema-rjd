// src/components/licenses/LicenseActivationForm.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { KeyRound, Calendar, User, Users, Package, LifeBuoy, FileText, X } from "lucide-react";
import {
  createLicenseActivationSchema,
  updateLicenseActivationSchema,
} from "@/lib/validations/license";
import type {
  LicenseActivation,
  LicensePackage,
  CreateLicenseActivationData,
} from "@/types/license";
import SingleDatePicker from "@/components/licenses/SingleDatePicker";
import ClientSearchSelect from "@/components/licenses/ClientSearchSelect";

interface Option {
  id: string;
  name: string;
}

interface LicenseActivationFormProps {
  activation?: LicenseActivation | null;
  packages: LicensePackage[];
  technicians: Option[];
  onSubmit: (data: CreateLicenseActivationData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function toDateInput(iso: string): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

function todayInLimaInput(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function LicenseActivationForm({
  activation,
  packages,
  technicians,
  onSubmit,
  onCancel,
  isLoading = false,
}: LicenseActivationFormProps) {
  const isEditing = !!activation;
  const formKey = activation ? activation.id : "new";

  const defaultPackageId = useMemo(() => {
    if (activation) return activation.packageId;
    const withStock = packages.find((p) => p.remainingLicenses > 0);
    return withStock?.id ?? "";
  }, [activation, packages]);

  const [formData, setFormData] = useState<CreateLicenseActivationData>(() => ({
    packageId: defaultPackageId,
    activationDate: activation ? toDateInput(activation.activationDate) : todayInLimaInput(),
    technicianId: activation?.technicianId ?? "",
    licenseKey: activation?.licenseKey ?? "",
    support: activation?.support ?? "",
    customerId: activation?.customerId ?? "",
    observations: activation?.observations ?? "",
  }));
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = useMemo<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    try {
      const schema = isEditing ? updateLicenseActivationSchema : createLicenseActivationSchema;
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
      setTouched({
        packageId: true, activationDate: true, technicianId: true,
        licenseKey: true, support: true, customerId: true,
      });
      try {
        const schema = isEditing ? updateLicenseActivationSchema : createLicenseActivationSchema;
        schema.parse(formData);
        onSubmit({
          ...formData,
          activationDate: new Date(`${formData.activationDate}T12:00:00.000Z`).toISOString(),
        });
      } catch (error) {
        console.error("Error de validación:", error);
      }
    },
    [formData, isEditing, onSubmit]
  );

  const isValid =
    Object.keys(errors).length === 0 &&
    formData.packageId && formData.technicianId && formData.customerId &&
    formData.licenseKey.trim() && formData.support.trim();

  return (
    <div key={formKey} className="card-dark-strong p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-2xl font-bold text-slate-100">
          {isEditing ? "Editar Activación" : "Nueva Activación"}
        </h2>
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200" disabled={isLoading}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-blue-400" /> Paquete *
          </label>
          <select
            value={formData.packageId}
            onChange={(e) => setFormData((p) => ({ ...p, packageId: e.target.value }))}
            onBlur={() => handleBlur("packageId")}
            className={`input-dark w-full ${errors.packageId ? "border-red-500" : ""}`}
            disabled={isLoading}
            required
          >
            <option value="">Seleccionar paquete</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id} disabled={p.remainingLicenses <= 0 && p.id !== formData.packageId}>
                {p.code} — quedan {p.remainingLicenses}
              </option>
            ))}
          </select>
          {errors.packageId && <p className="text-red-400 text-xs mt-1">{errors.packageId}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-green-400" /> Fecha *
            </label>
            <SingleDatePicker
              value={formData.activationDate}
              onChange={(v) => setFormData((p) => ({ ...p, activationDate: v }))}
              disabled={isLoading}
              error={!!errors.activationDate}
            />
            {errors.activationDate && <p className="text-red-400 text-xs mt-1">{errors.activationDate}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-yellow-400" /> Técnico (quién activó) *
            </label>
            <select
              value={formData.technicianId}
              onChange={(e) => setFormData((p) => ({ ...p, technicianId: e.target.value }))}
              onBlur={() => handleBlur("technicianId")}
              className={`input-dark w-full ${errors.technicianId ? "border-red-500" : ""}`}
              disabled={isLoading}
              required
            >
              <option value="">Seleccionar técnico</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.technicianId && <p className="text-red-400 text-xs mt-1">{errors.technicianId}</p>}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-400" /> Cliente *
          </label>
          <ClientSearchSelect
            value={formData.customerId}
            onChange={(id) => setFormData((p) => ({ ...p, customerId: id }))}
            initialLabel={activation?.customer.name}
            placeholder="Buscar cliente..."
            disabled={isLoading}
            error={!!errors.customerId}
          />
          {errors.customerId && <p className="text-red-400 text-xs mt-1">{errors.customerId}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <KeyRound className="w-4 h-4 text-green-400" /> Clave de licencia *
          </label>
          <input
            type="text"
            value={formData.licenseKey}
            onChange={(e) => setFormData((p) => ({ ...p, licenseKey: e.target.value }))}
            onBlur={() => handleBlur("licenseKey")}
            className={`input-dark w-full ${errors.licenseKey ? "border-red-500" : ""}`}
            placeholder="Clave / serial del antivirus"
            disabled={isLoading}
            required
          />
          {errors.licenseKey && <p className="text-red-400 text-xs mt-1">{errors.licenseKey}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <LifeBuoy className="w-4 h-4 text-yellow-400" /> Soporte / garantía *
          </label>
          <textarea
            value={formData.support}
            onChange={(e) => setFormData((p) => ({ ...p, support: e.target.value }))}
            onBlur={() => handleBlur("support")}
            className={`input-dark w-full min-h-20 ${errors.support ? "border-red-500" : ""}`}
            placeholder="Datos de soporte para garantía"
            disabled={isLoading}
            required
          />
          {errors.support && <p className="text-red-400 text-xs mt-1">{errors.support}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-400" /> Observaciones
          </label>
          <textarea
            value={formData.observations ?? ""}
            onChange={(e) => setFormData((p) => ({ ...p, observations: e.target.value }))}
            className="input-dark w-full min-h-16"
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-4 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 py-3 px-4 rounded-xl disabled:opacity-50" disabled={isLoading}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary-dark flex-1 py-3 px-4 rounded-xl disabled:opacity-50" disabled={isLoading || !isValid}>
            {isLoading ? "Guardando..." : isEditing ? "Actualizar" : "Registrar Activación"}
          </button>
        </div>
      </form>
    </div>
  );
}
