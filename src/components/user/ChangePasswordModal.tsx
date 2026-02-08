// src/components/user/ChangePasswordModal.tsx
"use client";

import { useEffect, useCallback, useState } from "react";
import { X, Lock, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import ConfirmModal from "@/components/clients/ConfirmModal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, validatePasswordStrength, type ChangePasswordInput } from "@/lib/validations/password";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPassword = watch("newPassword");
  const passwordStrength = newPassword ? validatePasswordStrength(newPassword) : null;

  const handleCloseAttempt = useCallback(() => {
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  // Manejar cierre con tecla ESC
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading && !showConfirmClose) {
        handleCloseAttempt();
      }
    },
    [handleCloseAttempt, isLoading, showConfirmClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setSuccessMessage("");
      setErrorMessage("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: ChangePasswordInput) => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al cambiar la contraseña");
      }

      setSuccessMessage("Contraseña actualizada exitosamente");
      reset();

      // Cerrar el modal después de 2 segundos
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Error al cambiar la contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={isLoading ? undefined : handleCloseAttempt}
      />

      {/* Modal */}
      <div className="relative card-dark-strong w-full max-w-lg mx-auto max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 rounded-lg bg-blue-600/20 border border-blue-600/30 flex-shrink-0">
              <Lock className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-slate-100">
              Cambiar Contraseña
            </h3>
          </div>
          {!isLoading && (
            <button
              onClick={handleCloseAttempt}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-green-600/20 border border-green-600/30">
              <p className="text-sm text-green-400 flex items-center gap-2">
                <Check className="w-4 h-4" />
                {successMessage}
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-600/20 border border-red-600/30">
              <p className="text-sm text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errorMessage}
              </p>
            </div>
          )}

          {/* Form */}
          <form id="change-password-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Contraseña Actual */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contraseña Actual *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  {...register("currentPassword")}
                  className="input-dark w-full pr-10"
                  placeholder="Ingrese su contraseña actual"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-xs text-red-400 mt-1">{errors.currentPassword.message}</p>
              )}
            </div>

            {/* Nueva Contraseña */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nueva Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  {...register("newPassword")}
                  className="input-dark w-full pr-10"
                  placeholder="Ingrese su nueva contraseña"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-red-400 mt-1">{errors.newPassword.message}</p>
              )}

              {/* Password Strength Indicator */}
              {newPassword && passwordStrength && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.isValid
                            ? "bg-green-500 w-full"
                            : passwordStrength.errors.length <= 2
                            ? "bg-yellow-500 w-2/3"
                            : "bg-red-500 w-1/3"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        passwordStrength.isValid
                          ? "text-green-400"
                          : passwordStrength.errors.length <= 2
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {passwordStrength.isValid
                        ? "Fuerte"
                        : passwordStrength.errors.length <= 2
                        ? "Media"
                        : "Débil"}
                    </span>
                  </div>
                  {!passwordStrength.isValid && (
                    <div className="space-y-1">
                      {passwordStrength.errors.map((error, index) => (
                        <p key={index} className="text-xs text-slate-400 flex items-center gap-1">
                          <span className="text-red-400">•</span> {error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirmar Nueva Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  className="input-dark w-full pr-10"
                  placeholder="Confirme su nueva contraseña"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Requisitos de Contraseña */}
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-xs font-medium text-slate-300 mb-2">
                La contraseña debe contener:
              </p>
              <ul className="space-y-1 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span> Mínimo 8 caracteres
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span> Al menos una letra mayúscula
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span> Al menos una letra minúscula
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span> Al menos un número
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span> Al menos un carácter especial (@$!%*?&#)
                </li>
              </ul>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 p-4 md:p-6 border-t border-slate-700 shrink-0">
          <button
            type="button"
            onClick={handleCloseAttempt}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 py-2.5 md:py-3 px-4 rounded-xl transition-colors disabled:opacity-50 text-sm md:text-base order-2 sm:order-1"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="change-password-form"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 md:py-3 px-4 rounded-xl transition-colors disabled:opacity-50 text-sm md:text-base order-1 sm:order-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Guardando...</span>
              </div>
            ) : (
              "Guardar Contraseña"
            )}
          </button>
        </div>
      </div>

      {/* Modal de confirmación para cerrar sin guardar */}
      <ConfirmModal
        isOpen={showConfirmClose}
        title="Cambios sin guardar"
        message="Tienes cambios sin guardar. ¿Deseas salir sin guardar?"
        confirmLabel="Salir sin guardar"
        cancelLabel="Seguir editando"
        confirmButtonColor="red"
        onConfirm={onClose}
        onCancel={() => setShowConfirmClose(false)}
      />
    </div>
  );
}
