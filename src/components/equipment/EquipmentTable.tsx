// src/components/equipment/EquipmentTable.tsx
"use client";

import { useCallback } from "react";
import {
  Laptop,
  Monitor,
  Printer,
  Package,
  Search,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
  Phone,
  Clock,
  Settings,
  AlertTriangle,
  Bell,
  UserCog,
  FileText,
} from "lucide-react";
import { formatPhone } from "@/lib/validations/client";
import { getRepairTimeBadge } from "@/lib/utils";
import { toast } from "sonner";
import type {
  Equipment,
  EquipmentFilters,
  EquipmentType,
  EquipmentStatus,
} from "@/types/equipment";

interface EquipmentTableProps {
  equipments: Equipment[];
  filters: EquipmentFilters;
  onFiltersChange: (filters: Partial<EquipmentFilters>) => void;
  onEdit: (equipment: Equipment) => void;
  onDelete: (equipment: Equipment) => void;
  onView: (equipment: Equipment) => void;
  onManageStatus: (equipment: Equipment) => void;
  isLoading?: boolean;
  userRole: "ADMINISTRADOR" | "TECNICO";
}

// Función para descargar comprobante directamente
const handleDownloadComprobante = async (equipmentId: string, code: string) => {
  // Mostrar toast con spinner girando - estilo verde personalizado
  const loadingToast = toast.loading("Generando comprobante...", {
    description: `Preparando documento para ${code}`,
    style: {
      background: "rgb(6, 78, 59)", // green-900
      color: "rgb(134, 239, 172)", // green-300
      border: "1px solid rgb(22, 163, 74)", // green-600
    },
  });

  try {
    const response = await fetch(`/api/equipments/${equipmentId}/comprobante`);
    if (!response.ok) throw new Error("Error al generar comprobante");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    // Descargar directamente en lugar de abrir en nueva pestaña
    const link = document.createElement("a");
    link.href = url;
    link.download = `comprobante-${code}-${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Actualizar toast de éxito con duración de 2 segundos
    toast.success("Comprobante descargado correctamente", {
      id: loadingToast,
      description: `Documento guardado: comprobante-${code}.pdf`,
      duration: 2000,
    });

    // Limpiar el objeto URL
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generando comprobante:", error);
    toast.error("Error al generar el comprobante", {
      id: loadingToast,
      description: "Por favor, intenta nuevamente",
      duration: 2000,
    });
  }
};

// Helper functions
const getStatusColor = (status: EquipmentStatus) => {
  switch (status) {
    case "RECEIVED":
      return "bg-blue-600/20 text-blue-400 border-blue-600/30";
    case "REPAIR":
      return "bg-yellow-600/20 text-yellow-400 border-yellow-600/30";
    case "REPAIRED":
      return "bg-green-600/20 text-green-400 border-green-600/30";
    case "DELIVERED":
      return "bg-purple-600/20 text-purple-400 border-purple-600/30";
    case "CANCELLED":
      return "bg-red-600/20 text-red-400 border-red-600/30";
    default:
      return "bg-gray-600/20 text-gray-400 border-gray-600/30";
  }
};

const getStatusLabel = (status: EquipmentStatus) => {
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
      return "Desconocido";
  }
};

const getTypeIcon = (type: EquipmentType) => {
  switch (type) {
    case "PC":
      return <Monitor className="w-5 h-5 text-blue-400" />;
    case "LAPTOP":
      return <Laptop className="w-5 h-5 text-purple-400" />;
    case "PRINTER":
    case "PLOTTER":
      return <Printer className="w-5 h-5 text-green-400" />;
    default:
      return <Package className="w-5 h-5 text-gray-400" />;
  }
};

const getTypeLabel = (type: EquipmentType) => {
  switch (type) {
    case "PC":
      return "PC";
    case "LAPTOP":
      return "Laptop";
    case "PRINTER":
      return "Impresora";
    case "PLOTTER":
      return "Plotter";
    default:
      return "Otro";
  }
};

// Mobile Card Component
function EquipmentCard({
  equipment,
  onDelete,
  onManageStatus,
  userRole,
}: {
  equipment: Equipment;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  onManageStatus: () => void;
  userRole: "ADMINISTRADOR" | "TECNICO";
}) {
  const isRepaired = equipment.status === "REPAIRED";
  const timeBadge = getRepairTimeBadge(equipment.status, equipment.entryDate);

  return (
    <div
      className={`card-dark p-4 space-y-4 ${
        isRepaired ? "ring-2 ring-green-500/50" : ""
      }`}
    >
      {/* Header: Código y Estado */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30 shrink-0">
            {getTypeIcon(equipment.type)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono font-semibold text-slate-100 truncate">
              {equipment.code}
            </div>
            <div className="text-xs text-slate-400">
              {getTypeLabel(equipment.type)}
              {equipment.brand && ` - ${equipment.brand}`}
              {equipment.model && ` ${equipment.model}`}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${getStatusColor(
              equipment.status
            )}`}
          >
            {getStatusLabel(equipment.status)}
          </span>
          {isRepaired && (
            <div className="flex items-center gap-1 text-green-400 text-xs">
              <Bell className="w-3 h-3 animate-pulse" />
              <span>Listo</span>
            </div>
          )}
          {timeBadge && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${timeBadge.color}`}
            >
              {timeBadge.text}
            </span>
          )}
        </div>
      </div>

      {/* Cliente */}
      {equipment.customer && (
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">{equipment.customer.name}</span>
          <span className="text-slate-500">|</span>
          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="text-xs">
            +51 {formatPhone(equipment.customer.phone)}
          </span>
        </div>
      )}

      {/* Técnico Asignado */}
      <div className="flex items-center gap-2 text-sm">
        <UserCog className="w-4 h-4 text-cyan-400 shrink-0" />
        <span
          className={
            equipment.assignedTechnician
              ? "text-slate-300"
              : "text-slate-500 italic"
          }
        >
          {equipment.assignedTechnician?.name || "Sin técnico asignado"}
        </span>
      </div>

      {/* Falla Reportada */}
      <div className="flex items-start gap-2 text-sm">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-slate-400 line-clamp-2">{equipment.reportedFlaw}</p>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{new Date(equipment.entryDate).toLocaleDateString()}</span>
        </div>
        {equipment.assignedTechnician && (
          <div className="flex items-center gap-1 truncate">
            <User className="w-3 h-3" />
            <span className="truncate">
              {equipment.assignedTechnician.name}
            </span>
          </div>
        )}
      </div>

      {/* Actions - Simplificado */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
        <button
          onClick={onManageStatus}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 transition-colors border border-blue-600/30 text-sm font-medium"
        >
          <Settings className="w-4 h-4" />
          <span>Gestionar</span>
        </button>
        <button
          onClick={() =>
            handleDownloadComprobante(equipment.id, equipment.code)
          }
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 transition-colors border border-emerald-600/30 text-sm"
          title="Generar comprobante"
        >
          <FileText className="w-4 h-4" />
        </button>
        {userRole === "ADMINISTRADOR" && (
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 transition-colors border border-red-600/30 text-sm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Desktop Table Row Component
function EquipmentRow({
  equipment,
  //onDelete,
  onManageStatus,
}: //userRole,
{
  equipment: Equipment;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  onManageStatus: () => void;
  userRole: "ADMINISTRADOR" | "TECNICO";
}) {
  const isRepaired = equipment.status === "REPAIRED";
  const timeBadge = getRepairTimeBadge(equipment.status, equipment.entryDate);

  return (
    <tr
      className={`border-b border-slate-700 hover:bg-slate-800/50 transition-colors ${
        isRepaired ? "bg-green-900/10" : ""
      }`}
    >
      {/* Código */}
      <td className="px-4 lg:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
            {getTypeIcon(equipment.type)}
          </div>
          <div>
            <div className="font-mono font-semibold text-slate-100 flex items-center gap-2">
              {equipment.code}
              {isRepaired && (
                <span title="Listo para entrega">
                  <Bell className="w-4 h-4 text-green-400 animate-pulse" />
                </span>
              )}
              {timeBadge && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${timeBadge.color}`}
                >
                  {timeBadge.text}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400">
              {getTypeLabel(equipment.type)}
              {equipment.brand && ` - ${equipment.brand}`}
            </div>
          </div>
        </div>
      </td>

      {/* Cliente */}
      <td className="px-4 lg:px-6 py-4">
        {equipment.customer && (
          <div>
            <div className="font-medium text-slate-100 truncate max-w-[150px]">
              {equipment.customer.name}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              +51 {formatPhone(equipment.customer.phone)}
            </div>
          </div>
        )}
      </td>

      {/* Falla */}
      <td className="px-4 lg:px-6 py-4 hidden xl:table-cell">
        <p className="text-sm text-slate-400 line-clamp-2 max-w-[200px]">
          {equipment.reportedFlaw}
        </p>
      </td>

      {/* Estado */}
      <td className="px-4 lg:px-6 py-4">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
            equipment.status
          )}`}
        >
          {getStatusLabel(equipment.status)}
        </span>
      </td>

      {/* Técnico */}
      <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
        {equipment.assignedTechnician ? (
          <span className="text-sm text-slate-300">
            {equipment.assignedTechnician.name}
          </span>
        ) : (
          <span className="text-sm text-slate-500">Sin asignar</span>
        )}
      </td>

      {/* Fecha */}
      <td className="px-4 lg:px-6 py-4 hidden xl:table-cell">
        <span className="text-sm text-slate-300">
          {new Date(equipment.entryDate).toLocaleDateString()}
        </span>
      </td>

      {/* Acciones - Simplificado */}
      <td className="px-4 lg:px-6 py-4">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onManageStatus}
            className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 transition-colors border border-blue-600/30"
            title="Gestionar equipo"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              handleDownloadComprobante(equipment.id, equipment.code)
            }
            className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 transition-colors border border-emerald-600/30"
            title="Generar comprobante"
          >
            <FileText className="w-4 h-4" />
          </button>
          {/* {userRole === "ADMINISTRADOR" && (
            <button
              onClick={onDelete}
              className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 transition-colors border border-red-600/30"
              title="Eliminar equipo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )} */}
        </div>
      </td>
    </tr>
  );
}

export default function EquipmentTable({
  equipments,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
  onView,
  onManageStatus,
  isLoading = false,
  userRole,
}: EquipmentTableProps) {
  const handleSearchInputChange = useCallback(
    (value: string) => {
      onFiltersChange({ search: value });
    },
    [onFiltersChange]
  );

  const handleClearSearch = useCallback(() => {
    onFiltersChange({ search: "" });
  }, [onFiltersChange]);

  const handleStatusFilterChange = useCallback(
    (status: EquipmentFilters["status"]) => {
      onFiltersChange({ status });
    },
    [onFiltersChange]
  );

  const handleTypeFilterChange = useCallback(
    (type: EquipmentFilters["type"]) => {
      onFiltersChange({ type });
    },
    [onFiltersChange]
  );

  const handleSortChange = (sortBy: EquipmentFilters["sortBy"]) => {
    const newSortOrder =
      filters.sortBy === sortBy && filters.sortOrder === "asc" ? "desc" : "asc";
    onFiltersChange({ sortBy, sortOrder: newSortOrder });
  };

  const getSortIcon = (column: EquipmentFilters["sortBy"]) => {
    if (filters.sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4 text-slate-500" />;
    }
    return filters.sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 text-blue-400" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-400" />
    );
  };

  // Contar equipos reparados
  const repairedCount = equipments.filter(
    (e) => e.status === "REPAIRED"
  ).length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Notificación de equipos reparados */}
      {repairedCount > 0 && (
        <div className="card-dark p-4 bg-green-900/20 border-green-600/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-600/20">
              <Bell className="w-5 h-5 text-green-400 animate-pulse" />
            </div>
            <div>
              <p className="text-green-400 font-medium">
                {repairedCount} equipo(s) listo(s) para entrega
              </p>
              <p className="text-green-400/70 text-sm">
                Contactar al cliente para coordinar la entrega
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="card-dark p-4 md:p-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            className="input-dark-with-icon w-full text-sm md:text-base"
            placeholder="Buscar por código, cliente, marca, modelo..."
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) =>
              handleStatusFilterChange(
                e.target.value as EquipmentFilters["status"]
              )
            }
            className="input-dark text-sm"
          >
            <option value="ALL">Todos los estados</option>
            <option value="RECEIVED">Recibido</option>
            <option value="REPAIR">En Reparación</option>
            <option value="REPAIRED">Reparado</option>
            <option value="DELIVERED">Entregado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>

          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) =>
              handleTypeFilterChange(e.target.value as EquipmentFilters["type"])
            }
            className="input-dark text-sm"
          >
            <option value="ALL">Todos los tipos</option>
            <option value="PC">PC</option>
            <option value="LAPTOP">Laptop</option>
            <option value="PRINTER">Impresora</option>
            <option value="PLOTTER">Plotter</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>

        {/* Results Summary */}
        <div className="pt-3 border-t border-slate-700">
          <div className="flex items-center justify-between text-xs md:text-sm text-slate-400">
            <span>
              {isLoading
                ? "Cargando..."
                : `${equipments.length} equipo(s) encontrado(s)`}
            </span>
            {filters.search && !isLoading && (
              <button
                onClick={handleClearSearch}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="card-dark p-8 md:p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando equipos...</p>
        </div>
      ) : equipments.length === 0 ? (
        <div className="card-dark p-8 md:p-12 text-center">
          <Laptop className="w-12 h-12 md:w-16 md:h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold text-slate-300 mb-2">
            No se encontraron equipos
          </h3>
          <p className="text-slate-400 mb-6 text-sm md:text-base">
            {filters.search ||
            filters.status !== "ALL" ||
            filters.type !== "ALL"
              ? "No hay equipos que coincidan con los filtros."
              : "Aún no has registrado ningún equipo."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: Card View */}
          <div className="md:hidden space-y-3">
            {equipments.map((equipment) => (
              <EquipmentCard
                key={equipment.id}
                equipment={equipment}
                onEdit={() => onEdit(equipment)}
                onDelete={() => onDelete(equipment)}
                onView={() => onView(equipment)}
                onManageStatus={() => onManageStatus(equipment)}
                userRole={userRole}
              />
            ))}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden md:block card-dark overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b border-slate-700">
                  <tr>
                    <th className="px-4 lg:px-6 py-4 text-left">
                      <button
                        onClick={() => handleSortChange("code")}
                        className="flex items-center gap-2 font-semibold text-slate-200 hover:text-blue-300 transition-colors"
                      >
                        Equipo
                        {getSortIcon("code")}
                      </button>
                    </th>
                    <th className="px-4 lg:px-6 py-4 text-left">
                      <div className="font-semibold text-slate-200">
                        Cliente
                      </div>
                    </th>
                    <th className="px-4 lg:px-6 py-4 text-left hidden xl:table-cell">
                      <div className="font-semibold text-slate-200">Falla</div>
                    </th>
                    <th className="px-4 lg:px-6 py-4 text-left">
                      <button
                        onClick={() => handleSortChange("status")}
                        className="flex items-center gap-2 font-semibold text-slate-200 hover:text-blue-300 transition-colors"
                      >
                        Estado
                        {getSortIcon("status")}
                      </button>
                    </th>
                    <th className="px-4 lg:px-6 py-4 text-left hidden lg:table-cell">
                      <div className="font-semibold text-slate-200">
                        Técnico
                      </div>
                    </th>
                    <th className="px-4 lg:px-6 py-4 text-left hidden xl:table-cell">
                      <button
                        onClick={() => handleSortChange("entryDate")}
                        className="flex items-center gap-2 font-semibold text-slate-200 hover:text-blue-300 transition-colors"
                      >
                        Ingreso
                        {getSortIcon("entryDate")}
                      </button>
                    </th>
                    <th className="px-4 lg:px-6 py-4">
                      <div className="font-semibold text-slate-200 text-center">
                        Acciones
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {equipments.map((equipment) => (
                    <EquipmentRow
                      key={equipment.id}
                      equipment={equipment}
                      onEdit={() => onEdit(equipment)}
                      onDelete={() => onDelete(equipment)}
                      onView={() => onView(equipment)}
                      onManageStatus={() => onManageStatus(equipment)}
                      userRole={userRole}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
