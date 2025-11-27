// src/components/equipment/EquipmentForm.tsx
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Laptop,
  Monitor,
  Printer,
  Package,
  AlertCircle,
  Wrench,
  Hash,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  User,
  Phone,
  FileText,
  UserPlus,
  Search,
  Loader2,
  DollarSign,
  UserCog,
} from "lucide-react";
import {
  createEquipmentSchema,
  updateEquipmentSchema,
} from "@/lib/validations/equipment";
import {
  createClientSchema,
  formatPhone,
  formatRUC,
} from "@/lib/validations/client";
import { apiFetch } from "@/lib/api";
import type {
  Equipment,
  CreateEquipmentData,
  UpdateEquipmentData,
  EquipmentFormErrors,
  EquipmentType,
} from "@/types/equipment";

// Tipos locales
interface Customer {
  id: string;
  name: string;
  phone: string;
  ruc: string | null;
}

interface Technician {
  id: string;
  name: string;
  email: string;
}

interface CreateClientData {
  name: string;
  phone: string;
  ruc?: string;
}

type PaymentMethod = "CASH" | "YAPE" | "PLIN" | "TRANSFER";
type PaymentType = "none" | "advance" | "full";

interface PaymentData {
  type: PaymentType;
  amount: number;
  method: PaymentMethod;
}

// Constantes
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

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  YAPE: "Yape",
  PLIN: "Plin",
  TRANSFER: "Transferencia",
};

interface EquipmentFormProps {
  equipment?: Equipment | null;
  onSubmit: (
    data: CreateEquipmentData | UpdateEquipmentData,
    extraData?: {
      assignedTechnicianId?: string;
      payment?: PaymentData;
    }
  ) => void;
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

  // Estado de pasos (3 pasos para nuevo, paso 2 directo para edición)
  const [currentStep, setCurrentStep] = useState(isEditing ? 2 : 1);
  const [step1Completed, setStep1Completed] = useState(isEditing);
  const [step2Completed, setStep2Completed] = useState(false);

  // Estado para modo de cliente
  const [clientMode, setClientMode] = useState<"search" | "create">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  // Estado del formulario de nuevo cliente
  const [newClientData, setNewClientData] = useState<CreateClientData>({
    name: "",
    phone: "",
    ruc: "",
  });
  const [clientTouched, setClientTouched] = useState<Record<string, boolean>>({});

  // Estado de técnicos
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>("");
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false);

  // Estado de pago
  const [paymentData, setPaymentData] = useState<PaymentData>({
    type: "none",
    amount: 0,
    method: "CASH",
  });

  // Estado para tipo de servicio personalizado
  const [customServiceType, setCustomServiceType] = useState("");
  const [isOtroSelected, setIsOtroSelected] = useState(false);

  // Estado del formulario de equipo
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
        others: equipment.others || "",
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
      others: "",
    };
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Cargar técnicos activos
  useEffect(() => {
    const loadTechnicians = async () => {
      setIsLoadingTechnicians(true);
      try {
        const response = await apiFetch("/api/tecnicos?status=ACTIVE&limit=100");
        if (response.ok) {
          const data = await response.json();
          setTechnicians(data.technicians || []);
        }
      } catch (error) {
        console.error("Error cargando técnicos:", error);
      } finally {
        setIsLoadingTechnicians(false);
      }
    };
    loadTechnicians();
  }, []);

  // Cerrar modal con tecla ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLoading, onCancel]);

  // Cargar cliente seleccionado si estamos editando
  useEffect(() => {
    if (equipment?.customerId && !selectedCustomer) {
      apiFetch(`/api/clients/${equipment.customerId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.client) {
            setSelectedCustomer(data.client);
          }
        })
        .catch(console.error);
    }
    if (equipment?.assignedTechnicianId) {
      setSelectedTechnicianId(equipment.assignedTechnicianId);
    }
    // Check if serviceType is custom (not in the predefined list or is "Otro")
    if (equipment?.serviceType) {
      const availableServices = serviceTypes[equipment.type] || [];
      const isCustomService = !availableServices.includes(equipment.serviceType) ||
                              equipment.serviceType === "Otro";
      if (isCustomService && equipment.serviceType !== "Otro") {
        setCustomServiceType(equipment.serviceType);
        setIsOtroSelected(true);
      }
    }
  }, [equipment, selectedCustomer]);

  // Validación de cliente nuevo
  const clientErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (clientMode !== "create") return errors;

    try {
      createClientSchema.parse(newClientData);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "errors" in error) {
        const zodError = error as {
          errors: Array<{ path: string[]; message: string }>;
        };
        zodError.errors.forEach((err) => {
          const field = err.path[0];
          if (clientTouched[field]) {
            errors[field] = err.message;
          }
        });
      }
    }
    return errors;
  }, [newClientData, clientTouched, clientMode]);

  // Validación del formulario de equipo
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

  // Búsqueda de clientes
  const searchCustomers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({ search: query, limit: "10" });
      const response = await apiFetch(`/api/clients?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.clients);
      }
    } catch (error) {
      console.error("Error buscando clientes:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce para búsqueda
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      const timer = setTimeout(() => {
        searchCustomers(value);
      }, 300);
      return () => clearTimeout(timer);
    },
    [searchCustomers]
  );

  // Seleccionar cliente
  const handleSelectCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData((prev) => ({ ...prev, customerId: customer.id }));
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  // Limpiar selección de cliente
  const handleClearCustomer = useCallback(() => {
    setSelectedCustomer(null);
    setFormData((prev) => ({ ...prev, customerId: "" }));
    setStep1Completed(false);
  }, []);

  // Crear nuevo cliente
  const handleCreateClient = useCallback(async () => {
    setClientTouched({ name: true, phone: true, ruc: true });

    try {
      createClientSchema.parse(newClientData);
    } catch {
      return;
    }

    setIsCreatingClient(true);
    try {
      const response = await apiFetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClientData),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedCustomer(data.client);
        setFormData((prev) => ({ ...prev, customerId: data.client.id }));
        setClientMode("search");
        setNewClientData({ name: "", phone: "", ruc: "" });
        setClientTouched({});
      } else {
        const error = await response.json();
        console.error("Error creando cliente:", error);
      }
    } catch (error) {
      console.error("Error creando cliente:", error);
    } finally {
      setIsCreatingClient(false);
    }
  }, [newClientData]);

  // Handlers para el formulario de cliente nuevo
  const handleClientInputChange = useCallback(
    (field: keyof CreateClientData, value: string) => {
      setNewClientData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleClientBlur = useCallback((field: string) => {
    setClientTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handlePhoneChange = useCallback(
    (value: string) => {
      const cleanValue = value.replace(/\D/g, "");
      if (cleanValue.length <= 9) {
        handleClientInputChange("phone", cleanValue);
      }
    },
    [handleClientInputChange]
  );

  const handleRUCChange = useCallback(
    (value: string) => {
      const cleanValue = value.replace(/\D/g, "");
      if (cleanValue.length <= 11) {
        handleClientInputChange("ruc", cleanValue);
      }
    },
    [handleClientInputChange]
  );

  // Handlers para el formulario de equipo
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
      serviceType: "",
    }));
    setCustomServiceType("");
    setIsOtroSelected(false);
  }, []);

  // Handler para cambio de tipo de servicio
  const handleServiceTypeChange = useCallback(
    (value: string) => {
      if (value === "Otro") {
        setIsOtroSelected(true);
        setFormData((prev) => ({ ...prev, serviceType: "" }));
        setCustomServiceType("");
      } else {
        setIsOtroSelected(false);
        setFormData((prev) => ({ ...prev, serviceType: value }));
        setCustomServiceType("");
      }
    },
    []
  );

  // Navegación entre pasos
  const handleNextStep = useCallback(
    (e?: React.MouseEvent) => {
      // Prevenir cualquier submit accidental
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (currentStep === 1 && (selectedCustomer || formData.customerId)) {
        setStep1Completed(true);
        setCurrentStep(2);
      } else if (currentStep === 2 && formData.reportedFlaw) {
        setStep2Completed(true);
        setCurrentStep(3);
      }
    },
    [currentStep, selectedCustomer, formData.customerId, formData.reportedFlaw]
  );

  const handlePrevStep = useCallback(() => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  }, [currentStep]);

  const goToStep = useCallback(
    (step: number) => {
      if (step === 1) {
        setCurrentStep(1);
      } else if (step === 2 && step1Completed) {
        setCurrentStep(2);
      } else if (step === 3 && step2Completed) {
        setCurrentStep(3);
      }
    },
    [step1Completed, step2Completed]
  );

  // Submit del formulario
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Use custom service type if "Otro" was selected
      const finalFormData = {
        ...formData,
        serviceType:
          formData.serviceType === "" && customServiceType
            ? customServiceType
            : formData.serviceType,
      };

      const allFields = Object.keys(finalFormData) as (keyof CreateEquipmentData)[];
      const allTouched = allFields.reduce(
        (acc, field) => ({ ...acc, [field]: true }),
        {}
      );
      setTouched(allTouched);

      try {
        const schema = isEditing ? updateEquipmentSchema : createEquipmentSchema;
        const validatedData = schema.parse(finalFormData);

        // Incluir datos extra (técnico y pago)
        const extraData: {
          assignedTechnicianId?: string;
          payment?: PaymentData;
        } = {};

        if (selectedTechnicianId) {
          extraData.assignedTechnicianId = selectedTechnicianId;
        }

        if (paymentData.type !== "none" && paymentData.amount > 0) {
          extraData.payment = paymentData;
        }

        onSubmit(validatedData, extraData);
      } catch (error: unknown) {
        // Manejar errores de Zod y mostrarlos al usuario
        if (error && typeof error === "object" && "errors" in error) {
          const zodError = error as {
            errors: Array<{ path: string[]; message: string }>;
          };

          // Marcar todos los campos con errores como tocados
          const errorFields: Record<string, boolean> = {};
          zodError.errors.forEach((err) => {
            const field = err.path[0];
            if (field) {
              errorFields[field] = true;
            }
          });
          setTouched((prev) => ({ ...prev, ...errorFields }));

          // Si hay error en reportedFlaw, volver al paso 2
          const hasFlawError = zodError.errors.some(
            (err) => err.path[0] === "reportedFlaw"
          );
          if (hasFlawError && !isEditing) {
            setCurrentStep(2);
          }
        }
      }
    },
    [formData, customServiceType, isEditing, onSubmit, selectedTechnicianId, paymentData]
  );

  // Validaciones
  const isStep1Valid = !!selectedCustomer || !!formData.customerId;
  // Paso 2 válido si hay descripción de falla (mínimo 1 caracter para avanzar, la validación completa se hace al submit)
  const isStep2Valid = !!formData.reportedFlaw && formData.reportedFlaw.trim().length > 0;
  const isClientFormValid =
    clientMode === "create" &&
    newClientData.name &&
    newClientData.phone &&
    Object.keys(clientErrors).length === 0;
  const hasErrors = Object.keys(errors).length > 0;
  const isFormValid = !hasErrors && formData.customerId && formData.reportedFlaw;
  const availableServices = serviceTypes[formData.type] || [];
  // Solo mostrar input personalizado cuando se selecciona "Otro" explícitamente
  const showCustomServiceInput = isOtroSelected;

  return (
    <div
      key={equipmentKey}
      className="card-dark-strong max-w-2xl mx-auto flex flex-col h-[85vh] max-h-[750px]"
    >
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-slate-700 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-slate-100">
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

        {/* Indicador de pasos - 3 pasos para nuevo equipo */}
        {!isEditing && (
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Paso 1 - Cliente */}
            <button
              onClick={() => goToStep(1)}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg transition-all ${
                currentStep === 1
                  ? "bg-blue-600/20 border border-blue-500 text-blue-300"
                  : step1Completed
                  ? "bg-green-600/20 border border-green-500 text-green-300"
                  : "bg-slate-700/50 border border-slate-600 text-slate-400"
              }`}
            >
              {step1Completed ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-xs">
                  1
                </span>
              )}
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                Cliente
              </span>
            </button>

            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 shrink-0" />

            {/* Paso 2 - Equipo */}
            <button
              onClick={() => goToStep(2)}
              disabled={!step1Completed}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg transition-all ${
                currentStep === 2
                  ? "bg-blue-600/20 border border-blue-500 text-blue-300"
                  : step2Completed
                  ? "bg-green-600/20 border border-green-500 text-green-300"
                  : "bg-slate-700/50 border border-slate-600 text-slate-400"
              } ${!step1Completed ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {step2Completed ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-xs">
                  2
                </span>
              )}
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                Equipo
              </span>
            </button>

            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 shrink-0" />

            {/* Paso 3 - Asignación y Pago */}
            <button
              onClick={() => goToStep(3)}
              disabled={!step2Completed}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg transition-all ${
                currentStep === 3
                  ? "bg-blue-600/20 border border-blue-500 text-blue-300"
                  : "bg-slate-700/50 border border-slate-600 text-slate-400"
              } ${!step2Completed ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-xs">
                3
              </span>
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                Finalizar
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <form id="equipment-form" onSubmit={handleSubmit} className="space-y-6">
          {/* PASO 1: Selección de Cliente */}
          {currentStep === 1 && !isEditing && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">
                Selecciona o crea un cliente
              </h3>

              {/* Cliente seleccionado */}
              {selectedCustomer ? (
                <div className="glass-dark p-4 rounded-xl border border-green-500/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-600/20 border border-green-600/30">
                        <User className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-100">
                          {selectedCustomer.name}
                        </p>
                        <p className="text-sm text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          +51 {formatPhone(selectedCustomer.phone)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearCustomer}
                      className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Tabs: Buscar / Crear */}
                  <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setClientMode("search")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        clientMode === "search"
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Search className="w-4 h-4" />
                      Buscar
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientMode("create")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        clientMode === "create"
                          ? "bg-green-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <UserPlus className="w-4 h-4" />
                      Nuevo
                    </button>
                  </div>

                  {/* Modo búsqueda */}
                  {clientMode === "search" && (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 rounded-xl py-3 pl-10 pr-10 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="Buscar por nombre o teléfono..."
                        />
                        {isSearching && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />
                        )}
                      </div>

                      {searchResults.length > 0 && (
                        <div className="bg-slate-800/50 border border-slate-600 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                          {searchResults.map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => handleSelectCustomer(customer)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-slate-700/50 transition-colors text-left border-b border-slate-700 last:border-b-0"
                            >
                              <div className="p-2 rounded-lg bg-purple-600/20 border border-purple-600/30 shrink-0">
                                <User className="w-4 h-4 text-purple-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-slate-100 truncate">
                                  {customer.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  +51 {formatPhone(customer.phone)}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {searchQuery && !isSearching && searchResults.length === 0 && (
                        <div className="text-center py-6">
                          <User className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                          <p className="text-slate-400">No se encontraron clientes</p>
                          <button
                            type="button"
                            onClick={() => setClientMode("create")}
                            className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Crear nuevo cliente →
                          </button>
                        </div>
                      )}

                      {!searchQuery && (
                        <p className="text-sm text-slate-500 text-center py-4">
                          Escribe el nombre o teléfono del cliente
                        </p>
                      )}
                    </div>
                  )}

                  {/* Modo crear cliente */}
                  {clientMode === "create" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
                          <User className="w-4 h-4 text-blue-400" />
                          <span>Nombre Completo *</span>
                        </label>
                        <input
                          type="text"
                          value={newClientData.name}
                          onChange={(e) => handleClientInputChange("name", e.target.value)}
                          onBlur={() => handleClientBlur("name")}
                          className={`input-dark w-full ${clientErrors.name ? "border-red-500" : ""}`}
                          placeholder="Ingresa el nombre completo"
                          disabled={isCreatingClient}
                        />
                        {clientErrors.name && (
                          <p className="text-red-400 text-xs mt-1">{clientErrors.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
                          <Phone className="w-4 h-4 text-green-400" />
                          <span>Teléfono *</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-prefix">+51</span>
                          <input
                            type="tel"
                            value={newClientData.phone ? formatPhone(newClientData.phone) : ""}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            onBlur={() => handleClientBlur("phone")}
                            className={`input-group-input ${clientErrors.phone ? "border-red-500" : ""}`}
                            placeholder="987 654 321"
                            disabled={isCreatingClient}
                          />
                        </div>
                        {clientErrors.phone && (
                          <p className="text-red-400 text-xs mt-1">{clientErrors.phone}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
                          <FileText className="w-4 h-4 text-yellow-400" />
                          <span>RUC (opcional)</span>
                        </label>
                        <input
                          type="text"
                          value={newClientData.ruc ? formatRUC(newClientData.ruc) : ""}
                          onChange={(e) => handleRUCChange(e.target.value)}
                          onBlur={() => handleClientBlur("ruc")}
                          className={`input-dark w-full ${clientErrors.ruc ? "border-red-500" : ""}`}
                          placeholder="10 o 20 + 9 dígitos"
                          disabled={isCreatingClient}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleCreateClient}
                        disabled={!isClientFormValid || isCreatingClient}
                        className="w-full btn-primary-dark py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isCreatingClient ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creando...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            Crear y Seleccionar
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* PASO 2: Datos del Equipo */}
          {(currentStep === 2 || isEditing) && (
            <div className="space-y-5">
              {/* Cliente seleccionado (resumen) */}
              {!isEditing && selectedCustomer && (
                <div className="glass-dark p-3 rounded-xl border border-slate-600">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-600/20 border border-green-600/30">
                      <User className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-100 text-sm truncate">
                        {selectedCustomer.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        +51 {formatPhone(selectedCustomer.phone)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              )}

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
              </div>

              {/* Marca y Modelo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
                    <Package className="w-4 h-4 text-purple-400" />
                    <span>Marca</span>
                  </label>
                  <input
                    type="text"
                    value={formData.brand || ""}
                    onChange={(e) => handleInputChange("brand", e.target.value)}
                    className="input-dark w-full"
                    placeholder="Ej: HP, Lenovo..."
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
                    <Package className="w-4 h-4 text-purple-400" />
                    <span>Modelo</span>
                  </label>
                  <input
                    type="text"
                    value={formData.model || ""}
                    onChange={(e) => handleInputChange("model", e.target.value)}
                    className="input-dark w-full"
                    placeholder="Ej: EliteBook 840..."
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Número de Serie y Accesorios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
                    <Hash className="w-4 h-4 text-green-400" />
                    <span>Número de Serie</span>
                  </label>
                  <input
                    type="text"
                    value={formData.serialNumber || ""}
                    onChange={(e) => handleInputChange("serialNumber", e.target.value)}
                    className="input-dark w-full"
                    placeholder="Opcional"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
                    <Package className="w-4 h-4 text-yellow-400" />
                    <span>Accesorios</span>
                  </label>
                  <input
                    type="text"
                    value={formData.accessories || ""}
                    onChange={(e) => handleInputChange("accessories", e.target.value)}
                    className="input-dark w-full"
                    placeholder="Ej: Cargador, mouse..."
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Falla Reportada - ANTES del tipo de servicio */}
              <div>
                <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span>Falla Reportada *</span>
                </label>
                <textarea
                  value={formData.reportedFlaw}
                  onChange={(e) => handleInputChange("reportedFlaw", e.target.value)}
                  onBlur={() => handleBlur("reportedFlaw")}
                  className={`input-dark w-full min-h-24 resize-y ${
                    errors.reportedFlaw ? "border-red-500" : ""
                  }`}
                  placeholder="Describe la falla o problema reportado por el cliente..."
                  disabled={isLoading}
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

              {/* Otros (Contraseñas, indicaciones adicionales) */}
              <div>
                <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Otros</span>
                </label>
                <textarea
                  value={formData.others || ""}
                  onChange={(e) => handleInputChange("others", e.target.value)}
                  className="input-dark w-full min-h-20 resize-y"
                  placeholder="Contraseñas, indicaciones adicionales, etc..."
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Información adicional como contraseñas del equipo o indicaciones especiales
                </p>
              </div>

              {/* Tipo de Servicio - DESPUÉS de la falla */}
              <div>
                <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
                  <Wrench className="w-4 h-4 text-orange-400" />
                  <span>Tipo de Servicio</span>
                </label>
                <select
                  value={customServiceType ? "Otro" : formData.serviceType || ""}
                  onChange={(e) => handleServiceTypeChange(e.target.value)}
                  className="input-dark w-full"
                  disabled={isLoading}
                >
                  <option value="">Seleccionar...</option>
                  {availableServices.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>

                {/* Input para tipo de servicio personalizado */}
                {showCustomServiceInput && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={customServiceType}
                      onChange={(e) => {
                        setCustomServiceType(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          serviceType: e.target.value,
                        }));
                      }}
                      className="input-dark w-full"
                      placeholder="Especifica el tipo de servicio..."
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>

              {/* Info de edición */}
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
                      <span className="font-medium">Fecha:</span>
                      <span className="ml-2">
                        {new Date(equipment.entryDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 3: Asignación de Técnico y Pago */}
          {currentStep === 3 && !isEditing && (
            <div className="space-y-6">
              <h3 className="text-sm font-medium text-slate-300">
                Asignación y pago inicial (opcional)
              </h3>

              {/* Resumen del equipo */}
              <div className="glass-dark p-4 rounded-xl border border-slate-600 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">{selectedCustomer?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Laptop className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-300">
                    {equipmentTypeLabels[formData.type]}
                    {formData.brand && ` - ${formData.brand}`}
                    {formData.model && ` ${formData.model}`}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-slate-400 line-clamp-2">
                    {formData.reportedFlaw}
                  </span>
                </div>
              </div>

              {/* Asignación de Técnico */}
              <div>
                <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-2">
                  <UserCog className="w-4 h-4 text-cyan-400" />
                  <span>Asignar Técnico</span>
                </label>
                <select
                  value={selectedTechnicianId}
                  onChange={(e) => setSelectedTechnicianId(e.target.value)}
                  className="input-dark w-full"
                  disabled={isLoading || isLoadingTechnicians}
                >
                  <option value="">Sin asignar (se asignará después)</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Puedes asignar un técnico ahora o hacerlo después al cambiar el estado
                </p>
              </div>

              {/* Sección de Pago */}
              <div className="glass-dark p-4 rounded-xl border border-slate-600">
                <label className="text-sm font-medium text-slate-200 flex items-center space-x-2 mb-3">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span>Pago Inicial</span>
                </label>

                {/* Tipo de pago */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setPaymentData((prev) => ({ ...prev, type: "none" }))}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                      paymentData.type === "none"
                        ? "bg-slate-600 border-slate-500 text-white"
                        : "bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    Sin pago
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentData((prev) => ({ ...prev, type: "advance" }))}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                      paymentData.type === "advance"
                        ? "bg-yellow-600/20 border-yellow-500 text-yellow-300"
                        : "bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    Adelanto
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentData((prev) => ({ ...prev, type: "full" }))}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                      paymentData.type === "full"
                        ? "bg-green-600/20 border-green-500 text-green-300"
                        : "bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    Pago Total
                  </button>
                </div>

                {/* Campos de pago */}
                {paymentData.type !== "none" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Monto</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-slate-400 text-sm font-medium">
                          S/
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={paymentData.amount || ""}
                          onChange={(e) =>
                            setPaymentData((prev) => ({
                              ...prev,
                              amount: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-full bg-slate-800 border border-slate-600 rounded-xl py-3 pl-10 pr-4 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Método</label>
                      <select
                        value={paymentData.method}
                        onChange={(e) =>
                          setPaymentData((prev) => ({
                            ...prev,
                            method: e.target.value as PaymentMethod,
                          }))
                        }
                        className="input-dark w-full"
                      >
                        {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((method) => (
                          <option key={method} value={method}>
                            {paymentMethodLabels[method]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Footer estático */}
      <div className="p-4 md:p-6 border-t border-slate-700 bg-slate-900/50 shrink-0">
        <div className="flex gap-3">
          {/* Botón Cancelar / Atrás */}
          {currentStep === 1 && !isEditing ? (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
          ) : (
            <button
              type="button"
              onClick={isEditing ? onCancel : handlePrevStep}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 py-3 px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isEditing ? (
                "Cancelar"
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  Atrás
                </>
              )}
            </button>
          )}

          {/* Botón Siguiente / Registrar */}
          {currentStep === 1 && !isEditing ? (
            <button
              type="button"
              onClick={handleNextStep}
              disabled={!isStep1Valid}
              className="flex-1 btn-primary-dark py-3 px-4 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : currentStep === 2 && !isEditing ? (
            <button
              type="button"
              onClick={handleNextStep}
              disabled={!isStep2Valid}
              className="flex-1 btn-primary-dark py-3 px-4 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              form="equipment-form"
              className="flex-1 btn-primary-dark py-3 px-4 rounded-xl disabled:opacity-50"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isEditing ? "Actualizando..." : "Registrando..."}</span>
                </div>
              ) : isEditing ? (
                "Actualizar Equipo"
              ) : (
                "Registrar Equipo"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
