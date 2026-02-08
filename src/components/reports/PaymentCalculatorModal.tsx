// src/components/reports/PaymentCalculatorModal.tsx
"use client";

import { useEffect, useState } from "react";
import { X, DollarSign, Users, Calculator, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/reports";

interface PaymentCalculatorModalProps {
  onClose: () => void;
  totalIncome: number;
  totalExpenses: number;
  periodLabel: string;
}

export default function PaymentCalculatorModal({
  onClose,
  totalIncome,
  totalExpenses,
  periodLabel,
}: PaymentCalculatorModalProps) {
  const [technicians, setTechnicians] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar técnicos activos
  useEffect(() => {
    const fetchTechnicians = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/tecnicos?status=ACTIVE");
        if (response.ok) {
          const data = await response.json();
          setTechnicians(data.technicians || []);
        }
      } catch (error) {
        console.error("Error cargando técnicos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTechnicians();
  }, []);

  // Efecto para cerrar modal con tecla ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const numTechnicians = technicians.length;

  // Calcular la diferencia (ingreso - egreso)
  const difference = totalIncome - totalExpenses;

  // Calcular pago por técnico (redondeado hacia abajo al múltiplo de 10 más cercano)
  const calculatePaymentPerTechnician = () => {
    if (numTechnicians === 0) return 0;
    const rawPayment = difference / numTechnicians;
    // Redondear hacia abajo al múltiplo de 10 más cercano
    return Math.floor(rawPayment / 10) * 10;
  };

  const paymentPerTechnician = calculatePaymentPerTechnician();
  const totalDistributed = paymentPerTechnician * numTechnicians;
  const remainder = difference - totalDistributed;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Calculator className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-100">
                  Calcular Pago a Trabajadores
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Distribución equitativa del ingreso{" "}
                  {periodLabel.toLowerCase()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">Cargando trabajadores...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Información Financiera del Período */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Ingreso */}
                <div className="glass-dark p-4 rounded-lg border border-green-600/30 bg-green-600/10">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <h3 className="text-xs font-medium text-slate-300">
                      Ingreso {periodLabel}
                    </h3>
                  </div>
                  <p className="text-xl font-bold text-green-400">
                    {formatCurrency(totalIncome)}
                  </p>
                </div>

                {/* Egreso */}
                <div className="glass-dark p-4 rounded-lg border border-red-600/30 bg-red-600/10">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-red-400" />
                    <h3 className="text-xs font-medium text-slate-300">
                      Egreso {periodLabel}
                    </h3>
                  </div>
                  <p className="text-xl font-bold text-red-400">
                    {formatCurrency(totalExpenses)}
                  </p>
                </div>

                {/* Diferencia */}
                <div className="glass-dark p-4 rounded-lg border border-blue-600/30 bg-blue-600/10">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-400" />
                    <h3 className="text-xs font-medium text-slate-300">
                      Diferencia
                    </h3>
                  </div>
                  <p className="text-xl font-bold text-blue-400">
                    {formatCurrency(difference)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Monto a distribuir
                  </p>
                </div>
              </div>

              {/* Información de Trabajadores */}
              <div className="glass-dark p-4 rounded-lg border border-purple-600/30 bg-purple-600/10">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-medium text-slate-200">
                    Trabajadores Activos
                  </h3>
                </div>
                <p className="text-2xl font-bold text-purple-400">
                  {numTechnicians}
                </p>
                {numTechnicians > 0 && (
                  <div className="mt-3 space-y-1">
                    {technicians.map((tech, index) => (
                      <div
                        key={tech.id}
                        className="text-sm text-slate-300 flex items-center gap-2"
                      >
                        <span className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        {tech.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cálculo del Pago */}
              {numTechnicians > 0 ? (
                <>
                  <div className="glass-dark p-4 rounded-lg border border-amber-600/30 bg-amber-600/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Calculator className="w-5 h-5 text-amber-400" />
                      <h3 className="text-sm font-medium text-slate-200">
                        Cálculo del Pago
                      </h3>
                    </div>

                    {/* Fórmula */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Diferencia (Ingreso - Egreso):</span>
                        <span className="font-medium text-blue-400">
                          {formatCurrency(difference)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">
                          Número de Trabajadores:
                        </span>
                        <span className="font-medium text-slate-200">
                          {numTechnicians}
                        </span>
                      </div>
                      <div className="border-t border-slate-600 pt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">
                            División (sin redondeo):
                          </span>
                          <span className="font-medium text-slate-200">
                            {formatCurrency(difference / numTechnicians)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Resultado Final */}
                    <div className="bg-amber-600/20 border border-amber-500/30 rounded-lg p-4">
                      <p className="text-xs text-slate-400 mb-1">
                        Pago por Trabajador (múltiplo de 10):
                      </p>
                      <p className="text-3xl font-bold text-amber-400">
                        {formatCurrency(paymentPerTechnician)}
                      </p>
                    </div>
                  </div>

                  {/* Resumen de Distribución */}
                  <div className="glass-dark p-4 rounded-lg border border-slate-600 bg-slate-700/30">
                    <h3 className="text-sm font-medium text-slate-200 mb-3">
                      Resumen de Distribución
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">
                          Total Distribuido:
                        </span>
                        <span className="font-medium text-green-400">
                          {formatCurrency(totalDistributed)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Remanente:</span>
                        <span className="font-medium text-amber-400">
                          {formatCurrency(remainder)}
                        </span>
                      </div>
                    </div>
                    {remainder > 0 && (
                      <div className="mt-3 flex items-start gap-2 text-xs text-slate-400 bg-amber-600/10 border border-amber-600/30 rounded p-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>
                          El remanente se genera por el redondeo al múltiplo de
                          10 más cercano hacia abajo
                        </span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="glass-dark p-6 rounded-lg border border-amber-600/30 bg-amber-600/10 text-center">
                  <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                  <p className="text-slate-200 font-medium mb-1">
                    No hay trabajadores activos
                  </p>
                  <p className="text-sm text-slate-400">
                    Debe haber al menos un trabajador activo para calcular el
                    pago
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="btn-primary-dark w-full py-3 px-4 rounded-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
