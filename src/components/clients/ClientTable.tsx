// src/components/clients/ClientTable.tsx
"use client";

import { useCallback } from "react";
import {
  Users,
  User,
  Search,
  Phone,
  Edit3,
  Trash2,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Calendar,
  Laptop,
} from "lucide-react";
import { formatPhone, formatRUC } from "@/lib/validations/client";
import type { Client, ClientFilters } from "@/types/client";

interface ClientTableProps {
  clients: Client[];
  filters: ClientFilters;
  onFiltersChange: (filters: Partial<ClientFilters>) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onView: (client: Client) => void;
  isLoading?: boolean;
}

interface ClientRowProps {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

interface ClientCardProps {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
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
function ClientCard({ client, onEdit, onDelete, onView }: ClientCardProps) {
  return (
    <div className="card-dark p-4 space-y-4">
      {/* Header: Nombre y Estado */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-purple-600/20 border border-purple-600/30 shrink-0">
            <User className="w-5 h-5 text-purple-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-100 truncate">
              {client.name}
            </div>
            {client.ruc && (
              <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <FileText className="w-3 h-3" />
                {formatRUC(client.ruc)}
              </div>
            )}
          </div>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${getStatusColor(
            client.status
          )}`}
        >
          {getStatusLabel(client.status)}
        </span>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">+51 {formatPhone(client.phone)}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Laptop className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{client.equipmentCount || 0} equipos</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate text-xs">
            {client.lastVisit || "Sin visitas"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs">
            {new Date(client.createdAt).toLocaleDateString()}
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
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 transition-colors border border-red-600/30 text-sm"
        >
          <Trash2 className="w-4 h-4" />
          <span>Eliminar</span>
        </button>
      </div>
    </div>
  );
}

// Desktop Table Row Component
function ClientRow({ client, onEdit, onDelete, onView }: ClientRowProps) {
  return (
    <tr className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
      {/* Nombre */}
      <td className="px-4 lg:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-600/20 border border-purple-600/30">
            <User className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="font-semibold text-slate-100">{client.name}</div>
            {client.ruc && (
              <div className="text-xs text-slate-400">
                RUC: {formatRUC(client.ruc)}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Teléfono */}
      <td className="px-4 lg:px-6 py-4">
        <div className="flex items-center gap-2 text-slate-300">
          <Phone className="w-4 h-4 text-slate-400" />
          <span>+51 {formatPhone(client.phone)}</span>
        </div>
      </td>

      {/* Equipos */}
      <td className="px-4 lg:px-6 py-4 text-center">
        <span className="text-lg font-bold text-slate-100">
          {client.equipmentCount || 0}
        </span>
      </td>

      {/* Última Visita */}
      <td className="px-4 lg:px-6 py-4 hidden xl:table-cell">
        <span className="text-sm text-slate-300">
          {client.lastVisit || "Nunca"}
        </span>
      </td>

      {/* Fecha Registro */}
      <td className="px-4 lg:px-6 py-4 hidden xl:table-cell">
        <span className="text-sm text-slate-300">
          {new Date(client.createdAt).toLocaleDateString()}
        </span>
      </td>

      {/* Acciones Directas */}
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
            title="Editar cliente"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 transition-colors border border-red-600/30"
            title="Eliminar cliente"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ClientTable({
  clients,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
  onView,
  isLoading = false,
}: ClientTableProps) {
  // Búsqueda directa sin debounce - filtra mientras escribes
  const handleSearchInputChange = useCallback(
    (value: string) => {
      onFiltersChange({ search: value });
    },
    [onFiltersChange]
  );

  // Función para limpiar búsqueda
  const handleClearSearch = useCallback(() => {
    onFiltersChange({ search: "" });
  }, [onFiltersChange]);

  // Función para limpiar todos los filtros
  const handleClearAllFilters = useCallback(() => {
    onFiltersChange({ search: "", status: "ALL" });
  }, [onFiltersChange]);

  const handleSortChange = (sortBy: ClientFilters["sortBy"]) => {
    const newSortOrder =
      filters.sortBy === sortBy && filters.sortOrder === "asc" ? "desc" : "asc";
    onFiltersChange({ sortBy, sortOrder: newSortOrder });
  };

  const getSortIcon = (column: ClientFilters["sortBy"]) => {
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
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            className="input-dark-with-icon w-full text-sm md:text-base"
            placeholder="Buscar por nombre, teléfono o RUC..."
          />
        </div>

        {/* Results Summary */}
        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between text-xs md:text-sm text-slate-400">
            <span>
              {isLoading
                ? "Cargando..."
                : `${clients.length} cliente(s) encontrado(s)`}
            </span>

            {filters.search && !isLoading && (
              <button
                onClick={handleClearSearch}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="card-dark p-8 md:p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando clientes...</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="card-dark p-8 md:p-12 text-center">
          <Users className="w-12 h-12 md:w-16 md:h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold text-slate-300 mb-2">
            No se encontraron clientes
          </h3>
          <p className="text-slate-400 mb-6 text-sm md:text-base">
            {filters.search
              ? "No hay clientes que coincidan con tu búsqueda."
              : "Aún no has registrado ningún cliente."}
          </p>
          {filters.search && (
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
            {clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={() => onEdit(client)}
                onDelete={() => onDelete(client)}
                onView={() => onView(client)}
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
                        Equipos
                      </div>
                    </th>
                    <th className="px-4 lg:px-6 py-4 text-left hidden xl:table-cell">
                      <button
                        onClick={() => handleSortChange("lastVisit")}
                        className="flex items-center gap-2 font-semibold text-slate-200 hover:text-blue-300 transition-colors"
                      >
                        Última Visita
                        {getSortIcon("lastVisit")}
                      </button>
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
                  {clients.map((client) => (
                    <ClientRow
                      key={client.id}
                      client={client}
                      onEdit={() => onEdit(client)}
                      onDelete={() => onDelete(client)}
                      onView={() => onView(client)}
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
