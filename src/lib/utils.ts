import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Funciones de utilidad para el sistema RJD
export const colors = {
  primary: {
    blue: "#2563eb",
    green: "#059669",
  },
  status: {
    received: "#6b7280", // gray-500
    repair: "#f59e0b", // amber-500
    repaired: "#10b981", // emerald-500
    delivered: "#3b82f6", // blue-500
    cancelled: "#ef4444", // red-500
  },
  payment: {
    pending: "#f59e0b", // amber-500
    partial: "#8b5cf6", // violet-500
    completed: "#10b981", // emerald-500
  },
};

export const gradients = {
  primary: "bg-gradient-to-r from-blue-600 to-green-600",
  primaryHover: "hover:from-blue-700 hover:to-green-700",
  background: "bg-gradient-to-br from-slate-50 via-blue-50 to-green-50",
};

// Formatear moneda peruana
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(amount);
};

// Formatear fecha para zona horaria de Perú
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Lima",
  }).format(dateObj);
};

// Formatear fecha y hora para zona horaria de Perú
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
  }).format(dateObj);
};

// Generar código único para equipos
export const generateEquipmentCode = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0");

  return `RJD-${year}${month}${day}-${random}`;
};

// Obtener color según estado de equipo
export const getEquipmentStatusColor = (status: string) => {
  switch (status) {
    case "RECEIVED":
      return "text-gray-700 bg-gray-100";
    case "REPAIR":
      return "text-amber-700 bg-amber-100";
    case "REPAIRED":
      return "text-emerald-700 bg-emerald-100";
    case "DELIVERED":
      return "text-blue-700 bg-blue-100";
    case "CANCELLED":
      return "text-red-700 bg-red-100";
    default:
      return "text-gray-700 bg-gray-100";
  }
};

// Obtener texto legible de estado de equipo
export const getEquipmentStatusText = (status: string) => {
  switch (status) {
    case "RECEIVED":
      return "Recibido";
    case "REPAIR":
      return "En Reparación";
    case "REPAIRED":
      return "Reparado";
    case "DELIVERED":
      return "Entregado";
    case "CANCELLED":
      return "Cancelado";
    default:
      return status;
  }
};
