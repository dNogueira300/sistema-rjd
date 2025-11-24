// src/types/equipment.ts

// Importar enums del schema Prisma
export type EquipmentType = "PC" | "LAPTOP" | "PRINTER" | "PLOTTER" | "OTHER";
export type EquipmentStatus = "RECEIVED" | "REPAIR" | "REPAIRED" | "DELIVERED" | "CANCELLED";
export type PaymentMethod = "CASH" | "YAPE" | "PLIN" | "TRANSFER";
export type PaymentStatus = "PENDING" | "PARTIAL" | "COMPLETED";
export type VoucherType = "RECEIPT" | "INVOICE" | "DELIVERY_NOTE";

export interface Payment {
  id: string;
  equipmentId: string;
  totalAmount: number;
  advanceAmount: number;
  remainingAmount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  voucherType: VoucherType;
  paymentStatus: PaymentStatus;
  observations: string | null;
}

export interface Equipment {
  id: string;
  code: string;
  type: EquipmentType;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  reportedFlaw: string;
  accessories: string | null;
  serviceType: string | null;
  status: EquipmentStatus;
  entryDate: Date;
  deliveryDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  customerId: string;
  assignedTechnicianId: string | null;
  // Relaciones expandidas
  customer?: {
    id: string;
    name: string;
    phone: string;
  };
  assignedTechnician?: {
    id: string;
    name: string;
    email: string;
  } | null;
  statusHistory?: EquipmentStatusHistoryItem[];
  payments?: Payment[];
}

export interface EquipmentStatusHistoryItem {
  id: string;
  status: EquipmentStatus;
  observations: string | null;
  changedBy: string;
  changedAt: Date;
  changedByUser?: {
    id: string;
    name: string;
  };
}

export interface CreateEquipmentData {
  customerId: string;
  type: EquipmentType;
  brand?: string;
  model?: string;
  serialNumber?: string;
  reportedFlaw: string;
  accessories?: string;
  serviceType?: string;
}

export interface UpdateEquipmentData extends Partial<CreateEquipmentData> {
  status?: EquipmentStatus;
  assignedTechnicianId?: string | null;
}

export interface ChangeStatusData {
  equipmentId: string;
  newStatus: EquipmentStatus;
  observations?: string;
  assignedTechnicianId?: string;
}

export interface EquipmentFilters {
  search: string;
  status: "ALL" | EquipmentStatus;
  type: "ALL" | EquipmentType;
  sortBy: "code" | "entryDate" | "status" | "type";
  sortOrder: "asc" | "desc";
}

export interface EquipmentFormErrors {
  customerId?: string;
  type?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  reportedFlaw?: string;
  accessories?: string;
  serviceType?: string;
}

export interface EquipmentResponse {
  equipments: Equipment[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Tipos de servicio por tipo de equipo
export const SERVICE_TYPES: Record<EquipmentType, string[]> = {
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

// Labels para mostrar
export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  PC: "PC de Escritorio",
  LAPTOP: "Laptop",
  PRINTER: "Impresora",
  PLOTTER: "Plotter",
  OTHER: "Otro",
};

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  RECEIVED: "Recibido",
  REPAIR: "En Reparación",
  REPAIRED: "Reparado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

// Colores para estados
export const EQUIPMENT_STATUS_COLORS: Record<EquipmentStatus, string> = {
  RECEIVED: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  REPAIR: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
  REPAIRED: "bg-green-600/20 text-green-400 border-green-600/30",
  DELIVERED: "bg-purple-600/20 text-purple-400 border-purple-600/30",
  CANCELLED: "bg-red-600/20 text-red-400 border-red-600/30",
};

// Labels para métodos de pago
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  YAPE: "Yape",
  PLIN: "Plin",
  TRANSFER: "Transferencia",
};

// Labels para estado de pago
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  COMPLETED: "Pagado",
};
