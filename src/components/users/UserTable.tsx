// src/components/users/UserTable.tsx
"use client";

import {
  Mail,
  Phone,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Wrench,
  UserX,
} from "lucide-react";
import { formatPhone } from "@/lib/validations/technician";
import { formatDate } from "@/lib/utils";
import { ROLE_LABELS, type SystemUser } from "@/types/user";

interface UserTableProps {
  users: SystemUser[];
  currentUserId?: string;
  isLoading?: boolean;
  onEdit: (user: SystemUser) => void;
  onToggleStatus: (user: SystemUser) => void;
  onDelete: (user: SystemUser) => void;
}

function RoleBadge({ role }: { role: SystemUser["role"] }) {
  const isAdmin = role === "ADMINISTRADOR";
  const Icon = isAdmin ? ShieldCheck : Wrench;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
        isAdmin
          ? "bg-amber-600/15 text-amber-300 border-amber-600/30"
          : "bg-cyan-600/15 text-cyan-300 border-cyan-600/30"
      }`}
    >
      <Icon className="w-3 h-3" />
      {ROLE_LABELS[role]}
    </span>
  );
}

function StatusBadge({ status }: { status: SystemUser["status"] }) {
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${
        status === "ACTIVE"
          ? "bg-green-600/20 text-green-400 border-green-600/30"
          : "bg-gray-600/20 text-gray-400 border-gray-600/30"
      }`}
    >
      {status === "ACTIVE" ? "Activo" : "Inactivo"}
    </span>
  );
}

function Actions({
  user,
  isSelf,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  user: SystemUser;
  isSelf: boolean;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const active = user.status === "ACTIVE";
  return (
    <div className="flex items-center gap-1.5 justify-end">
      <button
        onClick={onEdit}
        className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 transition-colors"
        title="Editar"
        aria-label={`Editar a ${user.name}`}
      >
        <Edit3 className="w-4 h-4" />
      </button>
      <button
        onClick={onToggleStatus}
        disabled={isSelf}
        className={`p-2 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          active
            ? "bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border-amber-600/30"
            : "bg-green-600/20 hover:bg-green-600/30 text-green-400 border-green-600/30"
        }`}
        title={isSelf ? "No puedes desactivar tu cuenta" : active ? "Desactivar" : "Activar"}
        aria-label={`${active ? "Desactivar" : "Activar"} a ${user.name}`}
      >
        {active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
      </button>
      <button
        onClick={onDelete}
        disabled={isSelf}
        className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title={isSelf ? "No puedes eliminar tu cuenta" : "Eliminar"}
        aria-label={`Eliminar a ${user.name}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function UserTable({
  users,
  currentUserId,
  isLoading,
  onEdit,
  onToggleStatus,
  onDelete,
}: UserTableProps) {
  if (isLoading) {
    return (
      <div className="card-dark p-10 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-600 border-t-blue-500" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="card-dark p-10 text-center">
        <UserX className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-300 font-medium">No se encontraron usuarios</p>
        <p className="text-sm text-slate-500 mt-1">
          Prueba con otros filtros o crea un usuario nuevo.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Escritorio */}
      <div className="card-dark overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/60 border-b border-slate-700">
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-center">Equipos</th>
                <th className="px-4 py-3 font-medium">Registro</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {users.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-100 flex items-center gap-2">
                        {u.name}
                        {isSelf && (
                          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-300">
                            Tú
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {u.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {u.phone ? `+51 ${formatPhone(u.phone)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-300">
                      {u.equipmentCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Actions
                        user={u}
                        isSelf={isSelf}
                        onEdit={() => onEdit(u)}
                        onToggleStatus={() => onToggleStatus(u)}
                        onDelete={() => onDelete(u)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Móvil */}
      <div className="md:hidden space-y-3">
        {users.map((u) => {
          const isSelf = u.id === currentUserId;
          return (
            <div key={u.id} className="card-dark p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-100 truncate">
                    {u.name} {isSelf && <span className="text-xs text-blue-300">(tú)</span>}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                    <Mail className="w-3 h-3 shrink-0" />
                    {u.email}
                  </p>
                  {u.phone && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      +51 {formatPhone(u.phone)}
                    </p>
                  )}
                </div>
                <StatusBadge status={u.status} />
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-700">
                <RoleBadge role={u.role} />
                <Actions
                  user={u}
                  isSelf={isSelf}
                  onEdit={() => onEdit(u)}
                  onToggleStatus={() => onToggleStatus(u)}
                  onDelete={() => onDelete(u)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
