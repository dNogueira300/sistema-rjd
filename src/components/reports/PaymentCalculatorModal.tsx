// src/components/reports/PaymentCalculatorModal.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  X,
  DollarSign,
  Users,
  Calculator,
  AlertCircle,
  Loader2,
  Check,
  Banknote,
} from "lucide-react";
import { formatCurrency } from "@/lib/reports";
import { toast } from "sonner";
import ConfirmModal from "@/components/clients/ConfirmModal";
import type { TechnicianPaymentDetail } from "@/types/reports";

interface PaymentCalculatorModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  totalIncome: number;
  totalExpenses: number;
  periodLabel: string;
  technicianPayments?: TechnicianPaymentDetail[];
}

// Tope máximo de pago por trabajador (política del negocio)
const MAX_SALARY_PER_WORKER = 250;

interface TechnicianPaymentCalc {
  id: string;
  name: string;
  basePayment: number;
  cappedPayment: number;
  existingPayments: number;
  finalPayment: number;
  wasCapped: boolean;
}

export default function PaymentCalculatorModal({
  onClose,
  onSuccess,
  totalIncome,
  totalExpenses,
  periodLabel,
  technicianPayments = [],
}: PaymentCalculatorModalProps) {
  const [technicians, setTechnicians] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showConfirmRegister, setShowConfirmRegister] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

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
      if (event.key === "Escape" && !isRegistering && !showConfirmRegister) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, isRegistering, showConfirmRegister]);

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

  const rawPaymentPerTechnician = calculatePaymentPerTechnician();

  // Aplicar tope máximo por política del negocio
  const isCapped = rawPaymentPerTechnician > MAX_SALARY_PER_WORKER;
  const paymentPerTechnician = isCapped ? MAX_SALARY_PER_WORKER : rawPaymentPerTechnician;

  // Calcular pagos existentes por técnico en el período y el pago final
  const technicianCalcs: TechnicianPaymentCalc[] = useMemo(() => {
    return technicians.map((tech) => {
      // Sumar todos los pagos existentes de este técnico en el período
      const existingPayments = technicianPayments
        .filter((p) => p.technicianName === tech.name)
        .reduce((sum, p) => sum + p.amount, 0);

      const finalPayment = Math.max(0, paymentPerTechnician - existingPayments);

      return {
        id: tech.id,
        name: tech.name,
        basePayment: rawPaymentPerTechnician,
        cappedPayment: paymentPerTechnician,
        existingPayments,
        finalPayment,
        wasCapped: isCapped,
      };
    });
  }, [technicians, technicianPayments, paymentPerTechnician, rawPaymentPerTechnician, isCapped]);

  const totalDistributed = technicianCalcs.reduce(
    (sum, t) => sum + t.finalPayment,
    0
  );
  const totalBaseDistributed = paymentPerTechnician * numTechnicians;
  const remainder = difference - totalBaseDistributed;
  const excessPerWorker = isCapped ? rawPaymentPerTechnician - MAX_SALARY_PER_WORKER : 0;
  const totalExcessByCap = excessPerWorker * numTechnicians;

  // Registrar pagos como egresos
  const handleRegisterPayments = async () => {
    setShowConfirmRegister(false);
    setIsRegistering(true);

    try {
      const techsToRegister = technicianCalcs.filter((t) => t.finalPayment > 0);

      if (techsToRegister.length === 0) {
        toast.error("No hay pagos pendientes para registrar");
        setIsRegistering(false);
        return;
      }

      const results = await Promise.allSettled(
        techsToRegister.map((tech) =>
          fetch("/api/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              expenseType: "SALARY",
              description: "PAGO SEMANA",
              amount: tech.finalPayment,
              beneficiary: tech.name,
              paymentMethod: "YAPE",
            }),
          })
        )
      );

      const successes = results.filter((r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<Response>).value.ok).length;
      const failures = results.length - successes;

      if (failures > 0) {
        toast.error(`${failures} pago(s) no se pudieron registrar`);
      }

      if (successes > 0) {
        toast.success(`${successes} pago(s) registrado(s) correctamente`);
        setRegisteredSuccess(true);
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error registrando pagos:", error);
      toast.error("Error al registrar los pagos");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={isRegistering ? undefined : onClose}
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
              disabled={isRegistering}
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
                      {isCapped ? (
                        <>
                          <p className="text-lg font-bold text-slate-500 line-through">
                            {formatCurrency(rawPaymentPerTechnician)}
                          </p>
                          <p className="text-3xl font-bold text-amber-400">
                            {formatCurrency(paymentPerTechnician)}
                          </p>
                        </>
                      ) : (
                        <p className="text-3xl font-bold text-amber-400">
                          {formatCurrency(paymentPerTechnician)}
                        </p>
                      )}
                    </div>

                    {/* Aviso de tope máximo */}
                    {isCapped && (
                      <div className="flex items-start gap-2 text-xs bg-red-600/10 border border-red-600/30 rounded-lg p-3 mt-3">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-red-400 font-medium">
                            Tope máximo aplicado: {formatCurrency(MAX_SALARY_PER_WORKER)}
                          </p>
                          <p className="text-slate-400 mt-1">
                            El pago calculado ({formatCurrency(rawPaymentPerTechnician)}) supera el tope máximo permitido por política del negocio. Se registrará {formatCurrency(MAX_SALARY_PER_WORKER)} por trabajador.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Detalle por Trabajador */}
                  <div className="glass-dark p-4 rounded-lg border border-purple-600/30 bg-purple-600/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-purple-400" />
                      <h3 className="text-sm font-medium text-slate-200">
                        Detalle por Trabajador
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {technicianCalcs.map((tech, index) => (
                        <div
                          key={tech.id}
                          className={`rounded-lg p-3 border ${
                            tech.finalPayment === 0
                              ? "bg-slate-700/30 border-slate-600/50"
                              : "bg-slate-700/50 border-slate-600"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center text-xs font-medium">
                                {index + 1}
                              </span>
                              <span className="text-sm font-medium text-slate-200">
                                {tech.name}
                              </span>
                            </div>
                            <span
                              className={`text-lg font-bold ${
                                tech.finalPayment === 0
                                  ? "text-slate-500"
                                  : "text-amber-400"
                              }`}
                            >
                              {formatCurrency(tech.finalPayment)}
                            </span>
                          </div>

                          {(tech.existingPayments > 0 || tech.wasCapped) && (
                            <div className="mt-2 ml-8 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">
                                  Pago calculado:
                                </span>
                                <span className={`text-slate-300 ${tech.wasCapped ? "line-through" : ""}`}>
                                  {formatCurrency(tech.basePayment)}
                                </span>
                              </div>
                              {tech.wasCapped && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-red-400">
                                    Tope máximo aplicado:
                                  </span>
                                  <span className="text-red-400 font-medium">
                                    {formatCurrency(tech.cappedPayment)}
                                  </span>
                                </div>
                              )}
                              {tech.existingPayments > 0 && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-orange-400">
                                    Registros existentes en el período:
                                  </span>
                                  <span className="text-orange-400 font-medium">
                                    - {formatCurrency(tech.existingPayments)}
                                  </span>
                                </div>
                              )}
                              {tech.finalPayment === 0 && (
                                <p className="text-xs text-slate-500 italic mt-1">
                                  Ya cubierto con registros previos
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
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
                          Total a Registrar:
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
                      {isCapped && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Excedente por tope máximo:</span>
                          <span className="font-medium text-red-400">
                            {formatCurrency(totalExcessByCap)}
                          </span>
                        </div>
                      )}
                    </div>
                    {(remainder > 0 || isCapped) && (
                      <div className="mt-3 flex items-start gap-2 text-xs text-slate-400 bg-amber-600/10 border border-amber-600/30 rounded p-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>
                          {isCapped && remainder > 0
                            ? `El remanente incluye ${formatCurrency(totalExcessByCap)} por tope máximo de ${formatCurrency(MAX_SALARY_PER_WORKER)} por trabajador y ${formatCurrency(remainder - totalExcessByCap)} por redondeo`
                            : isCapped
                            ? `El remanente se genera por el tope máximo de ${formatCurrency(MAX_SALARY_PER_WORKER)} por trabajador (política del negocio)`
                            : "El remanente se genera por el redondeo al múltiplo de 10 más cercano hacia abajo"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Mensaje de éxito */}
                  {registeredSuccess && (
                    <div className="flex items-center gap-2 p-4 rounded-lg bg-green-600/20 border border-green-600/30">
                      <Check className="w-5 h-5 text-green-400" />
                      <p className="text-sm text-green-400 font-medium">
                        Pagos registrados exitosamente como egresos
                      </p>
                    </div>
                  )}
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
        <div className="p-4 md:p-6 border-t border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
            disabled={isRegistering}
          >
            Cerrar
          </button>
          {numTechnicians > 0 &&
            paymentPerTechnician > 0 &&
            !registeredSuccess && (
              <button
                onClick={() => setShowConfirmRegister(true)}
                disabled={
                  isRegistering ||
                  technicianCalcs.every((t) => t.finalPayment === 0)
                }
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 font-medium"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Banknote className="w-4 h-4" />
                    Registrar Pagos
                  </>
                )}
              </button>
            )}
        </div>
      </div>

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={showConfirmRegister}
        title="Registrar Pagos"
        message={`Se registrarán ${technicianCalcs.filter((t) => t.finalPayment > 0).length} egreso(s) de tipo Salario por un total de ${formatCurrency(totalDistributed)}. ¿Desea continuar?`}
        confirmLabel="Registrar"
        cancelLabel="Cancelar"
        confirmButtonColor="green"
        onConfirm={handleRegisterPayments}
        onCancel={() => setShowConfirmRegister(false)}
      />
    </div>
  );
}
