// src/components/technicians/TechnicianTable.tsx
"use client";

import { useCallback } from "react";
import {
  Users,
  User,
  Search,
  Phone,
  Mail,
  Edit3,
  Trash2,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Laptop,
  Calendar,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { formatPhone } from "@/lib/validations/technician";
import type { Technician, TechnicianFilters } from "@/types/technician";

interface TechnicianTableProps {
  technicians: Technician[];
  filters: TechnicianFilters;
  onFiltersChange: (filters: Partial<TechnicianFilters>) => void;
  onEdit: (technician: Technician) => void;
  onDelete: (technician: Technician) => void;
  onView: (technician: Technician) => void;
  onToggleStatus: (technician: Technician) => void;
  isLoading?: boolean;
}

interface TechnicianRowProps {
  technician: Technician;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  onToggleStatus: () => void;
}

interface TechnicianCardProps {
  technician: Technician;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  onToggleStatus: () => void;
}

// Helper functions
const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-600/20 text-green-400 border-green-600/30";
    case "INACTIVE":
      return "bg-gray-600/20 text-gray-400 border-gray-600/30";
    default:
      return "bg-blue-600/20 text-blue-400 border-blue-600/30";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "Activo";
    case "INACTIVE":
      return "Inactivo";
    default:
      return "Desconocido";
  }
};

// Mobile Card Component
function TechnicianCard({
  technician,
  onEdit,
  onDelete,
  onView,
  onToggleStatus,
}: TechnicianCardProps) {
  return (
    <div className="card-dark p-4 space-y-4">
      {/* Header: Nombre y Estado */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-cyan-600/20 border border-cyan-600/30 shrink-0">
            <User className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-100 truncate">
              {technician.name}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3" />
              <span className="truncate">{technician.email}</span>
            </div>
          </div>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${getStatusColor(
            technician.status
          )}`}
        >
          {getStatusLabel(technician.status)}
        </span>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">
            {technician.phone ? `+51 ${formatPhone(technician.phone)}` : "Sin teléfono"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Laptop className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{technician.equipmentCount || 0} equipos</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300 col-span-2">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs">
            Registrado: {new Date(technician.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
        <button
          onClick={onView}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 transition-colors border border-blue-600/30 text-sm"
        >
          <Eye className="w-4 h-4" />
          <span>Ver</span>
        </button>
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 transition-colors border border-green-600/30 text-sm"
        >
          <Edit3 className="w-4 h-4" />
          <span>Editar</span>
        </button>
        <button
          onClick={onToggleStatus}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-colors border text-sm ${
            technician.status === "ACTIVE"
              ? "bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 hover:text-orange-300 border-orange-600/30"
              : "bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 hover:text-cyan-300 border-cyan-600/30"
          }`}
          title={technician.status === "ACTIVE" ? "Desactivar" : "Activar"}
        >
          {technician.status === "ACTIVE" ? (
            <ToggleRight className="w-4 h-4" />
          ) : (
            <ToggleLeft className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 transition-colors border border-red-600/30 text-sm"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Desktop Table Row Component
function TechnicianRow({
  technician,
  onEdit,
  onDelete,
  onView,
  onToggleStatus,
}: TechnicianRowProps) {
  return (
    <tr className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
      {/* Nombre */}
      <td className="px-4 lg:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-600/20 border border-cyan-600/30">
            <User className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="font-semibold text-slate-100">{technician.name}</div>
            <div className="text-xs text-slate-400">{technician.email}</div>
          </div>
        </div>
      </td>

      {/* Teléfono */}
      <td className="px-4 lg:px-6 py-4">
        <div className="flex items-center gap-2 text-slate-300">
          <Phone className="w-4 h-4 text-slate-400" />
          <span>
            {technician.phone ? `+51 ${formatPhone(technician.phone)}` : "—"}
          </span>
        </div>
      </td>

      {/* Equipos Asignados */}
      <td className="px-4 lg:px-6 py-4 text-center">
        <span className="text-lg font-bold text-slate-100">
          {technician.equipmentCount || 0}
        </span>
      </td>

      {/* Estado */}
      <td className="px-4 lg:px-6 py-4">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
            technician.status
          )}`}
        >
          {getStatusLabel(technician.status)}
        </span>
      </td>

      {/* Fecha Registro */}
      <td className="px-4 lg:px-6 py-4 hidden xl:table-cell">
        <span className="text-sm text-slate-300">
          {new Date(technician.createdAt).toLocaleDateString()}
        </span>
      </td>

      {/* Acciones */}
      <td className="px-4 lg:px-6 py-4">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onView}
            className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 transition-colors border border-blue-600/30"
            title="Ver detalles"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 transition-colors border border-green-600/30"
            title="Editar técnico"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleStatus}
            className={`p-2 rounded-lg transition-colors border ${
              technician.status === "ACTIVE"
                ? "bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 hover:text-orange-300 border-orange-600/30"
                : "bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 hover:text-cyan-300 border-cyan-600/30"
            }`}
            title={technician.status === "ACTIVE" ? "Desactivar" : "Activar"}
          >
            {technician.status === "ACTIVE" ? (
              <ToggleRight className="w-4 h-4" />
            ) : (
              <ToggleLeft className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 transition-colors border border-red-600/30"
            title="Eliminar técnico"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function TechnicianTable({
  technicians,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
  onView,
  onToggleStatus,
  isLoading = false,
}: TechnicianTableProps) {
  // Búsqueda directa sin debounce
  const handleSearchInputChange = useCallback(
    (value: string) => {
      onFiltersChange({ search: value });
    },
    [onFiltersChange]
  );

  // Función para limpiar todos los filtros
  const handleClearAllFilters = useCallback(() => {
    onFiltersChange({ search: "", status: "ALL" });
  }, [onFiltersChange]);

  const handleSortChange = (sortBy: TechnicianFilters["sortBy"]) => {
    const newSortOrder =
      filters.sortBy === sortBy && filters.sortOrder === "asc" ? "desc" : "asc";
    onFiltersChange({ sortBy, sortOrder: newSortOrder });
  };

  const handleStatusFilter = (status: TechnicianFilters["status"]) => {
    onFiltersChange({ status });
  };

  const getSortIcon = (column: TechnicianFilters["sortBy"]) => {
    if (filters.sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4 text-slate-500" />;
    }
    return filters.sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 text-blue-400" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-400" />
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Filters Section */}
      <div className="card-dark p-4 md:p-6">
        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              className="input-dark-with-icon w-full text-sm md:text-base"
              placeholder="Buscar por nombre, email o teléfono..."
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusFilter("ALL")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.status === "ALL"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => handleStatusFilter("ACTIVE")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.status === "ACTIVE"
                  ? "bg-green-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Activos
            </button>
            <button
              onClick={() => handleStatusFilter("INACTIVE")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.status === "INACTIVE"
                  ? "bg-gray-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Inactivos
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between text-xs md:text-sm text-slate-400">
            <span>
              {isLoading
                ? "Cargando..."
                : `${technicians.length} técnico(s) encontrado(s)`}
            </span>

            {(filters.search || filters.status !== "ALL") && !isLoading && (
              <button
                onClick={handleClearAllFilters}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="card-dark p-8 md:p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando técnicos...</p>
        </div>
      ) : technicians.length === 0 ? (
        <div className="card-dark p-8 md:p-12 text-center">
          <Users className="w-12 h-12 md:w-16 md:h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold text-slate-300 mb-2">
            No se encontraron técnicos
          </h3>
          <p className="text-slate-400 mb-6 text-sm md:text-base">
            {filters.search || filters.status !== "ALL"
              ? "No hay técnicos que coincidan con tu búsqueda."
              : "Aún no has registrado ningún técnico."}
          </p>
          {(filters.search || filters.status !== "ALL") && (
            <button
              onClick={handleClearAllFilters}
              className="btn-primary-dark px-6 py-2"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile: Card View */}
          <div className="md:hidden space-y-3">
            {technicians.map((technician) => (
              <TechnicianCard
                key={technician.id}
                technician={technician}
                onEdit={() => onEdit(technician)}
                onDelete={() => onDelete(technician)}
                onView={() => onView(technician)}
                onToggleStatus={() => onToggleStatus(technician)}
              />
            ))}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden md:block card-dark overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* Header */}
                <thead className="bg-slate-800/50 border-b border-slate-700">
                  <tr>
                    <th className="px-4 lg:px-6 py-4 text-left">
                      <button
                        onClick={() => handleSortChange("name")}
                        className="flex items-center gap-2 font-semibold text-slate-200 hover:text-blue-300 transition-colors"
                      >
                        Nombre
                        {getSortIcon("name")}
                      </button>
                    </th>
                    <th className="px-4 lg:px-6 py-4 text-left">
                      <div className="font-semibold text-slate-200">
                        Teléfono
                      </div>
                    </th>
                    <th className="px-4 lg:px-6 py-4 text-center">
                      <div className="font-semibold text-slate-200">
                        Equipos Asignados
                      </div>
                    </th>
                    <th className="px-4 lg:px-6 py-4 text-left">
                      <div className="font-semibold text-slate-200">Estado</div>
                    </th>
                    <th className="px-4 lg:px-6 py-4 text-left hidden xl:table-cell">
                      <button
                        onClick={() => handleSortChange("createdAt")}
                        className="flex items-center gap-2 font-semibold text-slate-200 hover:text-blue-300 transition-colors"
                      >
                        Registrado
                        {getSortIcon("createdAt")}
                      </button>
                    </th>
                    <th className="px-4 lg:px-6 py-4">
                      <div className="font-semibold text-slate-200 text-center">
                        Acciones
                      </div>
                    </th>
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {technicians.map((technician) => (
                    <TechnicianRow
                      key={technician.id}
                      technician={technician}
                      onEdit={() => onEdit(technician)}
                      onDelete={() => onDelete(technician)}
                      onView={() => onView(technician)}
                      onToggleStatus={() => onToggleStatus(technician)}
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
