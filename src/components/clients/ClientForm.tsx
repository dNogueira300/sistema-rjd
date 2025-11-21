// src/components/clients/ClientForm.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { User, Phone, FileText, X } from "lucide-react";
import {
  createClientSchema,
  updateClientSchema,
  formatPhone,
  formatRUC,
} from "@/lib/validations/client";
import type {
  Client,
  CreateClientData,
  UpdateClientData,
  ClientFormErrors,
} from "@/types/client";

interface ClientFormProps {
  client?: Client | null;
  onSubmit: (data: CreateClientData | UpdateClientData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
}

export default function ClientForm({
  client,
  onSubmit,
  onCancel,
  isLoading = false,
  title,
}: ClientFormProps) {
  const isEditing = !!client;

  // Usar key para forzar re-mount cuando client cambie (elimina necesidad de useEffect)
  const clientKey = client ? client.id : "new";

  // Estado del formulario - se resetea automáticamente cuando client cambie por la key
  const [formData, setFormData] = useState<CreateClientData>(() => {
    if (client) {
      return {
        name: client.name || "",
        phone: client.phone || "",
        ruc: client.ruc || "",
      };
    }
    return {
      name: "",
      phone: "",
      ruc: "",
    };
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validación en tiempo real con useMemo (sin useEffect)
  const errors = useMemo<ClientFormErrors>(() => {
    const newErrors: ClientFormErrors = {};

    try {
      const schema = isEditing ? updateClientSchema : createClientSchema;
      schema.parse(formData);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "errors" in error) {
        const zodError = error as {
          errors: Array<{ path: string[]; message: string }>;
        };
        zodError.errors.forEach((err) => {
          const field = err.path[0] as keyof ClientFormErrors;
          if (touched[field]) {
            newErrors[field] = err.message;
          }
        });
      }
    }

    return newErrors;
  }, [formData, touched, isEditing]);

  // Handlers memoizados para performance
  const handleInputChange = useCallback(
    (field: keyof CreateClientData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleBlur = useCallback((field: keyof CreateClientData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handlePhoneChange = useCallback(
    (value: string) => {
      // Solo permitir números
      const cleanValue = value.replace(/\D/g, "");
      if (cleanValue.length <= 9) {
        handleInputChange("phone", cleanValue);
      }
    },
    [handleInputChange]
  );

  const handleRUCChange = useCallback(
    (value: string) => {
      // Solo permitir números
      const cleanValue = value.replace(/\D/g, "");
      if (cleanValue.length <= 11) {
        handleInputChange("ruc", cleanValue);
      }
    },
    [handleInputChange]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Marcar todos los campos como tocados para mostrar errores
      const allFields = Object.keys(formData) as (keyof CreateClientData)[];
      const allTouched = allFields.reduce(
        (acc, field) => ({ ...acc, [field]: true }),
        {}
      );
      setTouched(allTouched);

      // Validar formulario completo
      try {
        const schema = isEditing ? updateClientSchema : createClientSchema;
        const validatedData = schema.parse(formData);
        onSubmit(validatedData);
      } catch (error) {
        console.error("Error de validación:", error);
      }
    },
    [formData, isEditing, onSubmit]
  );

  // Calculaciones derivadas
  const hasErrors = Object.keys(errors).length > 0;
  const isFormValid = !hasErrors && formData.name && formData.phone;

  return (
    <div key={clientKey} className="card-dark-strong p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-100">
          {title || (isEditing ? "Editar Cliente" : "Nuevo Cliente")}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre Completo */}
        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
            <User className="w-4 h-4 text-blue-400" />
            <span>Nombre Completo *</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            className={`input-dark w-full ${
              errors.name ? "border-red-500" : ""
            }`}
            placeholder="Ingresa el nombre completo"
            disabled={isLoading}
            required
          />
          {errors.name && (
            <p className="text-red-400 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
            <Phone className="w-4 h-4 text-green-400" />
            <span>Teléfono *</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
              +51
            </span>
            <input
              type="tel"
              value={formData.phone ? formatPhone(formData.phone) : ""}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={() => handleBlur("phone")}
              className={`input-dark w-full pl-14 ${
                errors.phone ? "border-red-500" : ""
              }`}
              placeholder="987 654 321"
              disabled={isLoading}
              required
            />
          </div>
          {errors.phone && (
            <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
          )}
        </div>

        {/* RUC */}
        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
            <FileText className="w-4 h-4 text-yellow-400" />
            <span>RUC</span>
          </label>
          <input
            type="text"
            value={formData.ruc ? formatRUC(formData.ruc) : ""}
            onChange={(e) => handleRUCChange(e.target.value)}
            onBlur={() => handleBlur("ruc")}
            className={`input-dark w-full ${
              errors.ruc ? "border-red-500" : ""
            }`}
            placeholder="10 o 20 + 9 dígitos (ej: 10123456789)"
            disabled={isLoading}
          />
          {errors.ruc && (
            <p className="text-red-400 text-xs mt-1">{errors.ruc}</p>
          )}
        </div>

        {/* Información adicional */}
        {isEditing && client && (
          <div className="glass-dark p-4 rounded-lg border border-slate-600">
            <h3 className="text-sm font-medium text-slate-200 mb-2">
              Información Adicional
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
              <div>
                <span className="font-medium">Equipos registrados:</span>
                <span className="ml-2">{client.equipmentCount || 0}</span>
              </div>
              <div>
                <span className="font-medium">Última visita:</span>
                <span className="ml-2">{client.lastVisit || "Nunca"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary-dark flex-1 py-3 px-4 rounded-xl disabled:opacity-50"
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{isEditing ? "Actualizando..." : "Creando..."}</span>
              </div>
            ) : isEditing ? (
              "Actualizar Cliente"
            ) : (
              "Crear Cliente"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
