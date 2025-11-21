// src/components/clients/ConfirmModal.tsx
"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmButtonColor?: "red" | "blue" | "green";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmButtonColor = "red",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getConfirmButtonClasses = () => {
    switch (confirmButtonColor) {
      case "red":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "green":
        return "bg-green-600 hover:bg-green-700 text-white";
      case "blue":
      default:
        return "bg-blue-600 hover:bg-blue-700 text-white";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={isLoading ? undefined : onCancel}
      />

      {/* Modal */}
      <div className="relative card-dark-strong p-4 md:p-6 w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 rounded-lg bg-orange-600/20 border border-orange-600/30 flex-shrink-0">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-slate-100">{title}</h3>
          </div>
          {!isLoading && (
            <button
              onClick={onCancel}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="mb-4 md:mb-6">
          <p className="text-sm md:text-base text-slate-300 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 py-2.5 md:py-3 px-4 rounded-xl transition-colors disabled:opacity-50 text-sm md:text-base order-2 sm:order-1"
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 md:py-3 px-4 rounded-xl transition-colors disabled:opacity-50 text-sm md:text-base order-1 sm:order-2 ${getConfirmButtonClasses()}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Procesando...</span>
              </div>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
