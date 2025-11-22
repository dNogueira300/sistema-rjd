// src/components/equipment/EquipmentForm.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Laptop,
  Monitor,
  Printer,
  Package,
  AlertCircle,
  Wrench,
  Hash,
  X,
} from "lucide-react";
import CustomerDropdown from "./CustomerDropdown";
import {
  createEquipmentSchema,
  updateEquipmentSchema,
} from "@/lib/validations/equipment";
import type {
  Equipment,
  CreateEquipmentData,
  UpdateEquipmentData,
  EquipmentFormErrors,
  EquipmentType,
  SERVICE_TYPES,
  EQUIPMENT_TYPE_LABELS,
} from "@/types/equipment";

// Importar las constantes directamente
const serviceTypes: Record<EquipmentType, string[]> = {
  PC: [
    "Formateo",
    "Mantenimiento preventivo",
    "Mantenimiento correctivo",
    "Cambio de componentes",
    "Instalación de software",
    "Recuperación de datos",
    "Diagnóstico",
    "Otro",
  ],
  LAPTOP: [
    "Formateo",
    "Mantenimiento preventivo",
    "Mantenimiento correctivo",
    "Cambio de pantalla",
    "Cambio de teclado",
    "Cambio de batería",
    "Instalación de software",
    "Recuperación de datos",
    "Diagnóstico",
    "Otro",
  ],
  PRINTER: [
    "Mantenimiento preventivo",
    "Mantenimiento correctivo",
    "Cambio de cabezal",
    "Cambio de rodillos",
    "Sistema continuo",
    "Recarga de tinta/tóner",
    "Diagnóstico",
    "Otro",
  ],
  PLOTTER: [
    "Mantenimiento preventivo",
    "Mantenimiento correctivo",
    "Cambio de cabezal",
    "Sistema continuo",
    "Calibración",
    "Diagnóstico",
    "Otro",
  ],
  OTHER: [
    "Mantenimiento preventivo",
    "Mantenimiento correctivo",
    "Diagnóstico",
    "Otro",
  ],
};

const equipmentTypeLabels: Record<EquipmentType, string> = {
  PC: "PC de Escritorio",
  LAPTOP: "Laptop",
  PRINTER: "Impresora",
  PLOTTER: "Plotter",
  OTHER: "Otro",
};

interface EquipmentFormProps {
  equipment?: Equipment | null;
  onSubmit: (data: CreateEquipmentData | UpdateEquipmentData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
}

const getEquipmentTypeIcon = (type: EquipmentType) => {
  switch (type) {
    case "PC":
      return <Monitor className="w-4 h-4" />;
    case "LAPTOP":
      return <Laptop className="w-4 h-4" />;
    case "PRINTER":
    case "PLOTTER":
      return <Printer className="w-4 h-4" />;
    default:
      return <Package className="w-4 h-4" />;
  }
};

export default function EquipmentForm({
  equipment,
  onSubmit,
  onCancel,
  isLoading = false,
  title,
}: EquipmentFormProps) {
  const isEditing = !!equipment;
  const equipmentKey = equipment ? equipment.id : "new";

  // Estado del formulario
  const [formData, setFormData] = useState<CreateEquipmentData>(() => {
    if (equipment) {
      return {
        customerId: equipment.customerId || "",
        type: equipment.type || "PC",
        brand: equipment.brand || "",
        model: equipment.model || "",
        serialNumber: equipment.serialNumber || "",
        reportedFlaw: equipment.reportedFlaw || "",
        accessories: equipment.accessories || "",
        serviceType: equipment.serviceType || "",
      };
    }
    return {
      customerId: "",
      type: "PC",
      brand: "",
      model: "",
      serialNumber: "",
      reportedFlaw: "",
      accessories: "",
      serviceType: "",
    };
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validación en tiempo real con useMemo
  const errors = useMemo<EquipmentFormErrors>(() => {
    const newErrors: EquipmentFormErrors = {};

    try {
      const schema = isEditing ? updateEquipmentSchema : createEquipmentSchema;
      schema.parse(formData);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "errors" in error) {
        const zodError = error as {
          errors: Array<{ path: string[]; message: string }>;
        };
        zodError.errors.forEach((err) => {
          const field = err.path[0] as keyof EquipmentFormErrors;
          if (touched[field]) {
            newErrors[field] = err.message;
          }
        });
      }
    }

    return newErrors;
  }, [formData, touched, isEditing]);

  // Handlers memoizados
  const handleInputChange = useCallback(
    (field: keyof CreateEquipmentData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleBlur = useCallback((field: keyof CreateEquipmentData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleTypeChange = useCallback((type: EquipmentType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      serviceType: "", // Reset service type when equipment type changes
    }));
  }, []);

  const handleCustomerChange = useCallback(
    (customerId: string) => {
      handleInputChange("customerId", customerId);
      setTouched((prev) => ({ ...prev, customerId: true }));
    },
    [handleInputChange]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Marcar todos los campos como tocados
      const allFields = Object.keys(formData) as (keyof CreateEquipmentData)[];
      const allTouched = allFields.reduce(
        (acc, field) => ({ ...acc, [field]: true }),
        {}
      );
      setTouched(allTouched);

      // Validar formulario completo
      try {
        const schema = isEditing ? updateEquipmentSchema : createEquipmentSchema;
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
  const isFormValid = !hasErrors && formData.customerId && formData.reportedFlaw;

  // Servicios disponibles según tipo de equipo
  const availableServices = serviceTypes[formData.type] || [];

  return (
    <div key={equipmentKey} className="card-dark-strong p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg md:text-2xl font-bold text-slate-100">
          {title || (isEditing ? "Editar Equipo" : "Registrar Equipo")}
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
        {/* Cliente */}
        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
            <span className="text-blue-400">*</span>
            <span>Cliente</span>
          </label>
          <CustomerDropdown
            value={formData.customerId}
            onChange={handleCustomerChange}
            error={errors.customerId}
            disabled={isLoading}
          />
        </div>

        {/* Tipo de Equipo */}
        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
            <Laptop className="w-4 h-4 text-blue-400" />
            <span>Tipo de Equipo *</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {(Object.keys(equipmentTypeLabels) as EquipmentType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                disabled={isLoading}
                className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                  formData.type === type
                    ? "bg-blue-600/20 border-blue-500 text-blue-300"
                    : "bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-500"
                }`}
              >
                {getEquipmentTypeIcon(type)}
                <span className="text-xs font-medium">{equipmentTypeLabels[type]}</span>
              </button>
            ))}
          </div>
          {errors.type && (
            <p className="text-red-400 text-xs mt-1">{errors.type}</p>
          )}
        </div>

        {/* Marca y Modelo en fila */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Marca */}
          <div>
            <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
              <Package className="w-4 h-4 text-purple-400" />
              <span>Marca</span>
            </label>
            <input
              type="text"
              value={formData.brand || ""}
              onChange={(e) => handleInputChange("brand", e.target.value)}
              onBlur={() => handleBlur("brand")}
              className={`input-dark w-full ${errors.brand ? "border-red-500" : ""}`}
              placeholder="Ej: HP, Lenovo, Epson..."
              disabled={isLoading}
            />
            {errors.brand && (
              <p className="text-red-400 text-xs mt-1">{errors.brand}</p>
            )}
          </div>

          {/* Modelo */}
          <div>
            <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
              <Package className="w-4 h-4 text-purple-400" />
              <span>Modelo</span>
            </label>
            <input
              type="text"
              value={formData.model || ""}
              onChange={(e) => handleInputChange("model", e.target.value)}
              onBlur={() => handleBlur("model")}
              className={`input-dark w-full ${errors.model ? "border-red-500" : ""}`}
              placeholder="Ej: EliteBook 840, L3150..."
              disabled={isLoading}
            />
            {errors.model && (
              <p className="text-red-400 text-xs mt-1">{errors.model}</p>
            )}
          </div>
        </div>

        {/* Número de Serie */}
        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
            <Hash className="w-4 h-4 text-green-400" />
            <span>Número de Serie</span>
          </label>
          <input
            type="text"
            value={formData.serialNumber || ""}
            onChange={(e) => handleInputChange("serialNumber", e.target.value)}
            onBlur={() => handleBlur("serialNumber")}
            className={`input-dark w-full ${errors.serialNumber ? "border-red-500" : ""}`}
            placeholder="Ingresa el número de serie (opcional)"
            disabled={isLoading}
          />
          {errors.serialNumber && (
            <p className="text-red-400 text-xs mt-1">{errors.serialNumber}</p>
          )}
        </div>

        {/* Falla Reportada */}
        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>Falla Reportada *</span>
          </label>
          <textarea
            value={formData.reportedFlaw}
            onChange={(e) => handleInputChange("reportedFlaw", e.target.value)}
            onBlur={() => handleBlur("reportedFlaw")}
            className={`input-dark w-full min-h-[100px] resize-y ${
              errors.reportedFlaw ? "border-red-500" : ""
            }`}
            placeholder="Describe detalladamente la falla o problema reportado por el cliente..."
            disabled={isLoading}
            required
          />
          <div className="flex justify-between mt-1">
            {errors.reportedFlaw && (
              <p className="text-red-400 text-xs">{errors.reportedFlaw}</p>
            )}
            <span className="text-xs text-slate-500 ml-auto">
              {formData.reportedFlaw.length}/500
            </span>
          </div>
        </div>

        {/* Accesorios */}
        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
            <Package className="w-4 h-4 text-yellow-400" />
            <span>Accesorios</span>
          </label>
          <input
            type="text"
            value={formData.accessories || ""}
            onChange={(e) => handleInputChange("accessories", e.target.value)}
            onBlur={() => handleBlur("accessories")}
            className={`input-dark w-full ${errors.accessories ? "border-red-500" : ""}`}
            placeholder="Ej: Cargador, mouse, mochila, cables USB..."
            disabled={isLoading}
          />
          {errors.accessories && (
            <p className="text-red-400 text-xs mt-1">{errors.accessories}</p>
          )}
        </div>

        {/* Tipo de Servicio */}
        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
            <Wrench className="w-4 h-4 text-orange-400" />
            <span>Tipo de Servicio</span>
          </label>
          <select
            value={formData.serviceType || ""}
            onChange={(e) => handleInputChange("serviceType", e.target.value)}
            onBlur={() => handleBlur("serviceType")}
            className={`input-dark w-full ${errors.serviceType ? "border-red-500" : ""}`}
            disabled={isLoading}
          >
            <option value="">Seleccionar tipo de servicio...</option>
            {availableServices.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
          {errors.serviceType && (
            <p className="text-red-400 text-xs mt-1">{errors.serviceType}</p>
          )}
        </div>

        {/* Información adicional (solo edición) */}
        {isEditing && equipment && (
          <div className="glass-dark p-4 rounded-lg border border-slate-600">
            <h3 className="text-sm font-medium text-slate-200 mb-2">
              Información del Registro
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
              <div>
                <span className="font-medium">Código:</span>
                <span className="ml-2 text-blue-400 font-mono">{equipment.code}</span>
              </div>
              <div>
                <span className="font-medium">Fecha de ingreso:</span>
                <span className="ml-2">
                  {new Date(equipment.entryDate).toLocaleDateString()}
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
                <span>{isEditing ? "Actualizando..." : "Registrando..."}</span>
              </div>
            ) : isEditing ? (
              "Actualizar Equipo"
            ) : (
              "Registrar Equipo"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
