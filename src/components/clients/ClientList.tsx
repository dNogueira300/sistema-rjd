// src/components/clients/ClientList.tsx
"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Filter,
  Phone,
  FileText,
  Edit3,
  Trash2,
  MoreVertical,
  Eye,
} from "lucide-react";
import { formatPhone, formatRUC } from "@/lib/validations/client";
import type { Client, ClientFilters } from "@/types/client";

interface ClientListProps {
  clients: Client[];
  filters: ClientFilters;
  onFiltersChange: (filters: Partial<ClientFilters>) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onView: (client: Client) => void;
  isLoading?: boolean;
}

interface ClientCardProps {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

function ClientCard({ client, onEdit, onDelete, onView }: ClientCardProps) {
  const [showActions, setShowActions] = useState(false);

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
    <div className="card-dark hover-lift border-l-4 border-purple-600 group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-600/20 border border-purple-600/30">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100 group-hover:text-blue-300 transition-colors">
                {client.name}
              </h3>
              {client.ruc && (
                <p className="text-sm text-slate-400">
                  RUC: {formatRUC(client.ruc)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                client.status
              )}`}
            >
              {getStatusLabel(client.status)}
            </span>

            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showActions && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-10">
                  <button
                    onClick={() => {
                      onView();
                      setShowActions(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors rounded-t-lg"
                  >
                    <Eye className="w-4 h-4" />
                    Ver detalles
                  </button>
                  <button
                    onClick={() => {
                      onEdit();
                      setShowActions(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      onDelete();
                      setShowActions(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-colors rounded-b-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Phone className="w-4 h-4 text-slate-400" />
            <span className="text-sm">+51 {formatPhone(client.phone)}</span>
          </div>

          {client.ruc && (
            <div className="flex items-center gap-2 text-slate-300">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-sm">RUC: {formatRUC(client.ruc)}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-100">
              {client.equipmentCount || 0}
            </p>
            <p className="text-xs text-slate-400">Equipos</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-300">
              {client.lastVisit || "Nunca"}
            </p>
            <p className="text-xs text-slate-400">Última visita</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-300">
              {new Date(client.createdAt).toLocaleDateString()}
            </p>
            <p className="text-xs text-slate-400">Registrado</p>
          </div>
        </div>
      </div>

      {/* Backdrop para cerrar menu */}
      {showActions && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
}

export default function ClientList({
  clients,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
  onView,
  isLoading = false,
}: ClientListProps) {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ search });
  };

  const handleStatusChange = (status: ClientFilters["status"]) => {
    onFiltersChange({ status });
  };

  const handleSortChange = (
    sortBy: ClientFilters["sortBy"],
    sortOrder: ClientFilters["sortOrder"]
  ) => {
    onFiltersChange({ sortBy, sortOrder });
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

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 whitespace-nowrap">
              Ordenar:
            </span>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split("-") as [
                  ClientFilters["sortBy"],
                  ClientFilters["sortOrder"]
                ];
                handleSortChange(sortBy, sortOrder);
              }}
              className="input-dark min-w-[180px]"
              disabled={isLoading}
            >
              <option value="name-asc">Nombre (A-Z)</option>
              <option value="name-desc">Nombre (Z-A)</option>
              <option value="createdAt-desc">Más recientes</option>
              <option value="createdAt-asc">Más antiguos</option>
              <option value="lastVisit-desc">Última visita</option>
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

      {/* Clients Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card-dark p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-slate-700 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-5 bg-slate-700 rounded w-32"></div>
                  <div className="h-4 bg-slate-700 rounded w-24"></div>
                </div>
              </div>
              <div className="space-y-3 mb-4">
                <div className="h-4 bg-slate-700 rounded w-40"></div>
                <div className="h-4 bg-slate-700 rounded w-48"></div>
              </div>
              <div className="flex justify-between pt-4 border-t border-slate-700">
                <div className="h-8 bg-slate-700 rounded w-16"></div>
                <div className="h-8 bg-slate-700 rounded w-20"></div>
                <div className="h-8 bg-slate-700 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="card-dark p-12 text-center">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      )}
    </div>
  );
}
