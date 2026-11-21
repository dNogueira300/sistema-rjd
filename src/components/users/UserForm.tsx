// src/components/users/UserForm.tsx
"use client";

import { useMemo, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  Eye,
  EyeOff,
  X,
  Wand2,
  AlertCircle,
} from "lucide-react";
import {
  createUserSchema,
  updateUserSchema,
  PASSWORD_RULE_MESSAGE,
} from "@/lib/validations/user";
import { formatPhone } from "@/lib/validations/technician";
import type {
  SystemUser,
  CreateUserData,
  UpdateUserData,
  UserRole,
} from "@/types/user";

interface UserFormProps {
  user?: SystemUser | null;
  isSelf?: boolean;
  onSubmit: (data: CreateUserData | UpdateUserData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

type Field = "name" | "email" | "phone" | "role" | "password";

// Genera una contraseña que cumple la política (mayús, minús, número, especial)
function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "@$!%*?&#";
  const all = upper + lower + digits + special;
  const rand = (set: string) => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return set[buf[0] % set.length];
  };
  const chars = [rand(upper), rand(lower), rand(digits), rand(special)];
  while (chars.length < 12) chars.push(rand(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const j = buf[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export default function UserForm({
  user,
  isSelf = false,
  onSubmit,
  onCancel,
  isLoading = false,
}: UserFormProps) {
  const isEditing = !!user;

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    role: (user?.role ?? "TECNICO") as UserRole,
    password: "",
  });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [showPassword, setShowPassword] = useState(false);

  // En edición, la contraseña solo se envía si se escribió una nueva
  const payload = useMemo(() => {
    const base = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role,
    };
    if (!isEditing) return { ...base, password: form.password };
    return form.password ? { ...base, password: form.password } : base;
  }, [form, isEditing]);

  const result = useMemo(
    () =>
      (isEditing ? updateUserSchema : createUserSchema).safeParse(payload),
    [payload, isEditing]
  );

  const errors = useMemo(() => {
    const map: Partial<Record<Field, string>> = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as Field;
        if (field && !map[field]) map[field] = issue.message;
      }
    }
    return map;
  }, [result]);

  const show = (f: Field) => (touched[f] ? errors[f] : undefined);

  const set = (field: Field, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      phone: true,
      role: true,
      password: true,
    });
    if (!result.success) return;
    onSubmit(result.data as CreateUserData | UpdateUserData);
  };

  const promotingToAdmin =
    isEditing && user?.role === "TECNICO" && form.role === "ADMINISTRADOR";

  return (
    <div className="card-dark-strong p-4 md:p-6 w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg md:text-2xl font-bold text-slate-100">
          {isEditing ? "Editar usuario" : "Nuevo usuario"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          disabled={isLoading}
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Nombre */}
        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-cyan-400" />
            Nombre completo *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            className={`input-dark w-full ${show("name") ? "border-red-500" : ""}`}
            placeholder="Nombre y apellidos"
            disabled={isLoading}
            autoFocus
          />
          {show("name") && (
            <p className="text-red-400 text-xs mt-1">{show("name")}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-blue-400" />
              Correo (usuario de acceso) *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              className={`input-dark w-full ${show("email") ? "border-red-500" : ""}`}
              placeholder="usuario@correo.com"
              disabled={isLoading}
              autoComplete="off"
            />
            {show("email") && (
              <p className="text-red-400 text-xs mt-1">{show("email")}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-green-400" />
              Teléfono
            </label>
            <div className="input-group">
              <span className="input-group-prefix">+51</span>
              <input
                type="tel"
                value={form.phone ? formatPhone(form.phone) : ""}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, "");
                  if (clean.length <= 9) set("phone", clean);
                }}
                onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                className={`input-group-input ${show("phone") ? "border-red-500" : ""}`}
                placeholder="987 654 321"
                disabled={isLoading}
              />
            </div>
            {show("phone") && (
              <p className="text-red-400 text-xs mt-1">{show("phone")}</p>
            )}
          </div>
        </div>

        {/* Rol */}
        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-amber-400" />
            Rol *
          </label>
          <div className="grid grid-cols-2 gap-3" role="radiogroup">
            {(
              [
                {
                  value: "TECNICO",
                  title: "Técnico",
                  desc: "Solo ve y gestiona equipos",
                },
                {
                  value: "ADMINISTRADOR",
                  title: "Administrador",
                  desc: "Acceso completo al sistema",
                },
              ] as const
            ).map((opt) => {
              const selected = form.role === opt.value;
              const disabled = isLoading || (isSelf && opt.value === "TECNICO");
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => set("role", opt.value)}
                  className={`text-left p-3 rounded-xl border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    selected
                      ? "border-blue-500 bg-blue-600/15"
                      : "border-slate-700 bg-slate-800/50 hover:border-slate-500"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-100">
                    {opt.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                </button>
              );
            })}
          </div>
          {isSelf && (
            <p className="text-xs text-slate-500 mt-2">
              No puedes quitarte el rol de administrador a ti mismo.
            </p>
          )}
          {promotingToAdmin && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-amber-600/10 border border-amber-600/30">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200">
                Este usuario tendrá acceso completo: finanzas, reportes,
                clientes y gestión de usuarios.
              </p>
            </div>
          )}
        </div>

        {/* Contraseña */}
        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            {isEditing ? "Nueva contraseña (opcional)" : "Contraseña *"}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                className={`input-dark w-full pr-10 font-mono ${show("password") ? "border-red-500" : ""}`}
                placeholder={
                  isEditing ? "Dejar vacío para no cambiarla" : "••••••••"
                }
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                set("password", generatePassword());
                setShowPassword(true);
                setTouched((t) => ({ ...t, password: true }));
              }}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm"
              disabled={isLoading}
              title="Generar contraseña segura"
            >
              <Wand2 className="w-4 h-4" />
              <span className="hidden sm:inline">Generar</span>
            </button>
          </div>
          {show("password") ? (
            <p className="text-red-400 text-xs mt-1">{show("password")}</p>
          ) : (
            <p className="text-xs text-slate-500 mt-1">{PASSWORD_RULE_MESSAGE}</p>
          )}
          {form.password && (
            <p className="text-xs text-slate-400 mt-1">
              Comparte esta contraseña con el usuario de forma privada.
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary-dark flex-1 py-3 px-4 rounded-xl disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                {isEditing ? "Guardando..." : "Creando..."}
              </span>
            ) : isEditing ? (
              "Guardar cambios"
            ) : (
              "Crear usuario"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
