// src/components/technicians/TechnicianForm.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { User, Phone, Mail, X, AlertCircle } from "lucide-react";
import {
  createTechnicianSchema,
  updateTechnicianSchema,
  formatPhone,
} from "@/lib/validations/technician";
import type {
  Technician,
  CreateTechnicianData,
  UpdateTechnicianData,
  TechnicianFormErrors,
} from "@/types/technician";

interface TechnicianFormProps {
  technician?: Technician | null;
  onSubmit: (data: CreateTechnicianData | UpdateTechnicianData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
}

export default function TechnicianForm({
  technician,
  onSubmit,
  onCancel,
  isLoading = false,
  title,
}: TechnicianFormProps) {
  const isEditing = !!technician;

  // Usar key para forzar re-mount cuando technician cambie
  const technicianKey = technician ? technician.id : "new";

  // Estado del formulario
  const [formData, setFormData] = useState<CreateTechnicianData>(() => {
    if (technician) {
      return {
        name: technician.name || "",
        email: technician.email || "",
        phone: technician.phone || "",
      };
    }
    return {
      name: "",
      email: "",
      phone: "",
    };
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validación en tiempo real con useMemo
  const errors = useMemo<TechnicianFormErrors>(() => {
    const newErrors: TechnicianFormErrors = {};

    try {
      const schema = isEditing ? updateTechnicianSchema : createTechnicianSchema;
      schema.parse(formData);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "errors" in error) {
        const zodError = error as {
          errors: Array<{ path: string[]; message: string }>;
        };
        zodError.errors.forEach((err) => {
          const field = err.path[0] as keyof TechnicianFormErrors;
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
    (field: keyof CreateTechnicianData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleBlur = useCallback((field: keyof CreateTechnicianData) => {
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

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Marcar todos los campos como tocados para mostrar errores
      const allFields = Object.keys(formData) as (keyof CreateTechnicianData)[];
      const allTouched = allFields.reduce(
        (acc, field) => ({ ...acc, [field]: true }),
        {}
      );
      setTouched(allTouched);

      // Validar formulario completo
      try {
        const schema = isEditing ? updateTechnicianSchema : createTechnicianSchema;
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
  const isFormValid = !hasErrors && formData.name && formData.email;

  return (
    <div key={technicianKey} className="card-dark-strong p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg md:text-2xl font-bold text-slate-100">
          {title || (isEditing ? "Editar Técnico" : "Nuevo Técnico")}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Aviso de contraseña temporal */}
      {!isEditing && (
        <div className="mb-6 p-4 rounded-lg bg-amber-600/10 border border-amber-600/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-400">
                Contraseña temporal
              </p>
              <p className="text-xs text-slate-400 mt-1">
                El técnico será creado con la contraseña temporal:{" "}
                <code className="bg-slate-700 px-1.5 py-0.5 rounded text-amber-300">
                  temp123
                </code>
                . Deberá cambiarla en su primer inicio de sesión.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre Completo */}
        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
            <User className="w-4 h-4 text-cyan-400" />
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

        {/* Email */}
        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
            <Mail className="w-4 h-4 text-blue-400" />
            <span>Correo Electrónico *</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            className={`input-dark w-full ${
              errors.email ? "border-red-500" : ""
            }`}
            placeholder="ejemplo@correo.com"
            disabled={isLoading}
            required
          />
          {errors.email && (
            <p className="text-red-400 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
            <Phone className="w-4 h-4 text-green-400" />
            <span>Teléfono</span>
          </label>
          <div className="input-group">
            <span className="input-group-prefix">+51</span>
            <input
              type="tel"
              value={formData.phone ? formatPhone(formData.phone) : ""}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={() => handleBlur("phone")}
              className={`input-group-input ${
                errors.phone ? "border-red-500" : ""
              }`}
              placeholder="987 654 321"
              disabled={isLoading}
            />
          </div>
          {errors.phone && (
            <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">
            Formato: 9 dígitos empezando con 9
          </p>
        </div>

        {/* Información adicional */}
        {isEditing && technician && (
          <div className="glass-dark p-4 rounded-lg border border-slate-600">
            <h3 className="text-sm font-medium text-slate-200 mb-2">
              Información Adicional
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
              <div>
                <span className="font-medium">Equipos asignados:</span>
                <span className="ml-2">{technician.equipmentCount || 0}</span>
              </div>
              <div>
                <span className="font-medium">Estado:</span>
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full ${
                    technician.status === "ACTIVE"
                      ? "bg-green-600/20 text-green-400"
                      : "bg-gray-600/20 text-gray-400"
                  }`}
                >
                  {technician.status === "ACTIVE" ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="font-medium">Fecha de registro:</span>
                <span className="ml-2">
                  {new Date(technician.createdAt).toLocaleDateString()}
                </span>
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
              "Actualizar Técnico"
            ) : (
              "Crear Técnico"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
