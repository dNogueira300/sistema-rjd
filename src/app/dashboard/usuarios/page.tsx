// src/app/dashboard/usuarios/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  UserCog,
  Plus,
  RefreshCw,
  Users,
  ShieldCheck,
  Wrench,
  UserCheck,
  Search,
} from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import UserForm from "@/components/users/UserForm";
import UserTable from "@/components/users/UserTable";
import ConfirmModal from "@/components/clients/ConfirmModal";
import Pagination from "@/components/clients/Pagination";
import MetricCard from "@/components/reports/MetricCard";
import type {
  SystemUser,
  CreateUserData,
  UpdateUserData,
  UserFilters,
} from "@/types/user";

type ModalType = "form" | "toggle" | "delete" | null;

export default function UsuariosPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const {
    users,
    stats,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    filters,
    isLoading,
    isFetching,
    isError,
    error,
    createUser,
    updateUser,
    deleteUser,
    isCreating,
    isUpdating,
    isDeleting,
    updateFilters,
    setCurrentPage,
    refresh,
  } = useUsers();

  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<SystemUser | null>(null);
  const [searchInput, setSearchInput] = useState(filters.search);

  // Búsqueda con retardo para no consultar en cada tecla
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== filters.search) updateFilters({ search: searchInput });
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput, filters.search, updateFilters]);

  const busy = isCreating || isUpdating || isDeleting;

  const close = () => {
    if (busy) return;
    setModal(null);
    setSelected(null);
  };

  // Cerrar formulario con ESC
  useEffect(() => {
    if (modal !== "form") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        setModal(null);
        setSelected(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modal, busy]);

  const done = () => {
    setModal(null);
    setSelected(null);
  };

  const handleSubmit = (data: CreateUserData | UpdateUserData) => {
    if (selected) {
      updateUser({ id: selected.id, data }, { onSuccess: done });
    } else {
      createUser(data as CreateUserData, { onSuccess: done });
    }
  };

  const handleToggle = () => {
    if (!selected) return;
    updateUser(
      {
        id: selected.id,
        data: { status: selected.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
      },
      { onSuccess: done }
    );
  };

  const handleDelete = () => {
    if (!selected) return;
    deleteUser(selected.id, {
      onSuccess: () => {
        done();
        // Si se borró el último de la página, volver a la anterior
        if (users.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1);
      },
    });
  };

  if (isError) {
    return (
      <div className="card-dark p-12 text-center">
        <UserCog className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <h3 className="text-xl font-semibold text-slate-100 mb-2">
          Error al cargar usuarios
        </h3>
        <p className="text-slate-400 mb-6">{error?.message}</p>
        <button
          onClick={() => refresh()}
          className="btn-primary-dark px-6 py-2 inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      </div>
    );
  }

  const selectedActive = selected?.status === "ACTIVE";

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Encabezado */}
      <div className="card-dark p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 rounded-lg bg-linear-to-br from-amber-500 to-amber-700 shrink-0">
              <UserCog className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-slate-100 truncate">
                Gestión de Usuarios
              </h2>
              <p className="text-sm md:text-base text-slate-400 hidden sm:block">
                Cuentas de acceso, roles y administradores del sistema
              </p>
            </div>
          </div>
          <div className="flex gap-2 md:gap-3 sm:justify-end">
            <button
              onClick={() => refresh()}
              className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 md:px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 flex-1 sm:flex-none justify-center"
              disabled={isFetching}
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
              <span>Actualizar</span>
            </button>
            <button
              onClick={() => {
                setSelected(null);
                setModal("form");
              }}
              className="btn-primary-dark px-3 md:px-4 py-2 rounded-lg inline-flex items-center gap-2 flex-1 sm:flex-none justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo usuario</span>
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title="Total usuarios"
          value={stats?.total ?? "—"}
          icon={Users}
          iconColor="text-blue-400"
          borderColor="border-blue-500"
          bgColor="bg-blue-600/10"
          iconBg="bg-blue-600/20"
        />
        <MetricCard
          title="Administradores"
          value={stats?.admins ?? "—"}
          icon={ShieldCheck}
          iconColor="text-amber-400"
          borderColor="border-amber-500"
          bgColor="bg-amber-600/10"
          iconBg="bg-amber-600/20"
        />
        <MetricCard
          title="Técnicos"
          value={stats?.technicians ?? "—"}
          icon={Wrench}
          iconColor="text-cyan-400"
          borderColor="border-cyan-500"
          bgColor="bg-cyan-600/10"
          iconBg="bg-cyan-600/20"
        />
        <MetricCard
          title="Activos"
          value={stats?.active ?? "—"}
          icon={UserCheck}
          iconColor="text-green-400"
          borderColor="border-green-500"
          bgColor="bg-green-600/10"
          iconBg="bg-green-600/20"
          subtitle={stats ? `${stats.inactive} inactivos` : undefined}
        />
      </div>

      {/* Filtros */}
      <div className="card-dark p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono"
            className="input-dark w-full pl-9!"
            aria-label="Buscar usuarios"
          />
        </div>
        <select
          value={filters.role}
          onChange={(e) =>
            updateFilters({ role: e.target.value as UserFilters["role"] })
          }
          className="input-dark md:w-48"
          aria-label="Filtrar por rol"
        >
          <option value="ALL">Todos los roles</option>
          <option value="ADMINISTRADOR">Administradores</option>
          <option value="TECNICO">Técnicos</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) =>
            updateFilters({ status: e.target.value as UserFilters["status"] })
          }
          className="input-dark md:w-44"
          aria-label="Filtrar por estado"
        >
          <option value="ALL">Todos los estados</option>
          <option value="ACTIVE">Activos</option>
          <option value="INACTIVE">Inactivos</option>
        </select>
      </div>

      <UserTable
        users={users}
        currentUserId={currentUserId}
        isLoading={isLoading}
        onEdit={(u) => {
          setSelected(u);
          setModal("form");
        }}
        onToggleStatus={(u) => {
          setSelected(u);
          setModal("toggle");
        }}
        onDelete={(u) => {
          setSelected(u);
          setModal("delete");
        }}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
      />

      {/* Formulario crear / editar */}
      {modal === "form" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />
          <div className="relative w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <UserForm
              key={selected?.id ?? "new"}
              user={selected}
              isSelf={!!selected && selected.id === currentUserId}
              onSubmit={handleSubmit}
              onCancel={close}
              isLoading={isCreating || isUpdating}
            />
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={modal === "toggle"}
        title={selectedActive ? "Desactivar usuario" : "Activar usuario"}
        message={
          selected
            ? selectedActive
              ? `¿Desactivar a ${selected.name}? No podrá iniciar sesión hasta que lo actives de nuevo.`
              : `¿Activar a ${selected.name}? Podrá volver a iniciar sesión.`
            : ""
        }
        confirmLabel={selectedActive ? "Desactivar" : "Activar"}
        confirmButtonColor={selectedActive ? "red" : "green"}
        onConfirm={handleToggle}
        onCancel={close}
        isLoading={isUpdating}
      />

      <ConfirmModal
        isOpen={modal === "delete"}
        title="Eliminar usuario"
        message={
          selected
            ? `¿Eliminar definitivamente a ${selected.name}? Esta acción no se puede deshacer. Si tiene historial (equipos, licencias o pagos) no se podrá eliminar; desactívalo en su lugar.`
            : ""
        }
        confirmLabel="Eliminar"
        confirmButtonColor="red"
        onConfirm={handleDelete}
        onCancel={close}
        isLoading={isDeleting}
      />
    </div>
  );
}
