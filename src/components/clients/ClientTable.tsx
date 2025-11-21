// src/components/clients/ClientTable.tsx
"use client";

import {
  Users,
  Search,
  Filter,
  Phone,
  Edit3,
  Trash2,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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

function ClientRow({ client, onEdit, onDelete, onView }: ClientRowProps) {
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

  return (
    <tr className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
      {/* Nombre */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-600/20 border border-purple-600/30">
            <Users className="w-4 h-4 text-purple-400" />
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
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-slate-300">
          <Phone className="w-4 h-4 text-slate-400" />
          <span>+51 {formatPhone(client.phone)}</span>
        </div>
      </td>

      {/* Estado */}
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
            client.status
          )}`}
        >
          {getStatusLabel(client.status)}
        </span>
      </td>

      {/* Equipos */}
      <td className="px-6 py-4 text-center">
        <span className="text-lg font-bold text-slate-100">
          {client.equipmentCount || 0}
        </span>
      </td>

      {/* Última Visita */}
      <td className="px-6 py-4">
        <span className="text-sm text-slate-300">
          {client.lastVisit || "Nunca"}
        </span>
      </td>

      {/* Fecha Registro */}
      <td className="px-6 py-4">
        <span className="text-sm text-slate-300">
          {new Date(client.createdAt).toLocaleDateString()}
        </span>
      </td>

      {/* Acciones Directas */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          {/* Ver Detalles */}
          <button
            onClick={onView}
            className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 transition-colors border border-blue-600/30"
            title="Ver detalles"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Editar */}
          <button
            onClick={onEdit}
            className="p-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 transition-colors border border-green-600/30"
            title="Editar cliente"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Eliminar */}
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
  const handleSearchChange = (search: string) => {
    onFiltersChange({ search });
  };

  const handleStatusChange = (status: ClientFilters["status"]) => {
    onFiltersChange({ status });
  };

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
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="card-dark p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="input-dark w-full pl-10"
              placeholder="Buscar por nombre, teléfono o RUC..."
              disabled={isLoading}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filters.status}
              onChange={(e) =>
                handleStatusChange(e.target.value as ClientFilters["status"])
              }
              className="input-dark min-w-[150px]"
              disabled={isLoading}
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>
              {isLoading
                ? "Cargando..."
                : `${clients.length} cliente(s) encontrado(s)`}
            </span>

            {filters.search && !isLoading && (
              <button
                onClick={() => onFiltersChange({ search: "" })}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card-dark overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-slate-400">Cargando clientes...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              No se encontraron clientes
            </h3>
            <p className="text-slate-400 mb-6">
              {filters.search
                ? "No hay clientes que coincidan con tu búsqueda."
                : "Aún no has registrado ningún cliente."}
            </p>
            {filters.search && (
              <button
                onClick={() => onFiltersChange({ search: "", status: "ALL" })}
                className="btn-primary-dark px-6 py-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Header */}
              <thead className="bg-slate-800/50 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSortChange("name")}
                      className="flex items-center gap-2 font-semibold text-slate-200 hover:text-blue-300 transition-colors"
                    >
                      Nombre
                      {getSortIcon("name")}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="font-semibold text-slate-200">Teléfono</div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="font-semibold text-slate-200">Estado</div>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <div className="font-semibold text-slate-200">Equipos</div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSortChange("lastVisit")}
                      className="flex items-center gap-2 font-semibold text-slate-200 hover:text-blue-300 transition-colors"
                    >
                      Última Visita
                      {getSortIcon("lastVisit")}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSortChange("createdAt")}
                      className="flex items-center gap-2 font-semibold text-slate-200 hover:text-blue-300 transition-colors"
                    >
                      Registrado
                      {getSortIcon("createdAt")}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right">
                    <div className="font-semibold text-slate-200">Acciones</div>
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
        )}
      </div>
    </div>
  );
}
