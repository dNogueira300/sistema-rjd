// src/components/finance/TransactionForm.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Loader2, DollarSign, FileText } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreatePayment,
  useUpdatePayment,
  useCreateExpense,
} from "@/hooks/useTransactions";
import { useEquipments } from "@/hooks/useEquipments";
import type {
  TransactionType,
  ExpenseType,
  CreatePaymentData,
  CreateExpenseData,
} from "@/types/finance";
import type { PaymentMethod, PaymentStatus } from "@/types/equipment";
import { EXPENSE_TYPE_LABELS } from "@/types/finance";
import { PAYMENT_METHOD_LABELS } from "@/types/equipment";

interface TransactionFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransactionForm({
  onClose,
  onSuccess,
}: TransactionFormProps) {
  const [transactionType, setTransactionType] =
    useState<TransactionType>("INGRESO");

  // Estados para Ingreso (Payment)
  const [equipmentId, setEquipmentId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState(""); // Antes era advanceAmount
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [existingPaymentId, setExistingPaymentId] = useState<string | null>(
    null
  );
  const [markAsDelivered, setMarkAsDelivered] = useState(false);

  // Estados para Egreso (Expense)
  const [expenseType, setExpenseType] = useState<ExpenseType>("SUPPLIES");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [expensePaymentMethod, setExpensePaymentMethod] =
    useState<PaymentMethod>("CASH");

  // Estados comunes
  const [observations, setObservations] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estado para técnicos (beneficiarios de egresos)
  const [technicians, setTechnicians] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false);

  const queryClient = useQueryClient();
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const createExpense = useCreateExpense();

  // Definir isLoading primero
  const isLoading =
    createPayment.isPending ||
    updatePayment.isPending ||
    createExpense.isPending;

  // Cargar equipos solo si es ingreso
  const shouldLoadEquipments = transactionType === "INGRESO";
  const { equipments: allEquipments } = useEquipments({
    initialFilters: {
      search: "",
      status: shouldLoadEquipments ? "REPAIRED" : "ALL", // Solo equipos reparados pueden recibir pagos
      type: "ALL",
      sortBy: "code",
      sortOrder: "desc",
    },
  });

  // Filtrar equipos para mostrar solo los que tienen pago pendiente/parcial o sin pago
  const equipments = useMemo(() => {
    if (!shouldLoadEquipments || !allEquipments) return [];

    return allEquipments.filter((equip) => {
      // Si no tiene pagos, mostrarlo
      if (!equip.payments || equip.payments.length === 0) return true;

      // Si tiene pago, verificar que sea PENDING o PARTIAL
      const payment = equip.payments[0];
      return (
        payment.paymentStatus === "PENDING" ||
        payment.paymentStatus === "PARTIAL"
      );
    });
  }, [shouldLoadEquipments, allEquipments]);

  // Calcular monto pendiente
  const pendingAmount = useMemo(() => {
    const total = parseFloat(totalAmount) || 0;
    const paid = parseFloat(paidAmount) || 0;
    return total - paid;
  }, [totalAmount, paidAmount]);

  // Calcular estado de pago automáticamente
  const calculatedPaymentStatus = useMemo((): PaymentStatus => {
    const total = parseFloat(totalAmount) || 0;
    const paid = parseFloat(paidAmount) || 0;

    if (paid === 0) return "PENDING";
    if (paid >= total) return "COMPLETED";
    return "PARTIAL";
  }, [totalAmount, paidAmount]);

  // Cargar técnicos cuando se selecciona EGRESO
  useEffect(() => {
    const fetchTechnicians = async () => {
      if (transactionType !== "EGRESO") return;

      setIsLoadingTechnicians(true);
      try {
        const response = await fetch("/api/tecnicos?status=ACTIVE");
        if (response.ok) {
          const data = await response.json();
          setTechnicians(data.technicians || []);
        }
      } catch (error) {
        console.error("Error cargando técnicos:", error);
      } finally {
        setIsLoadingTechnicians(false);
      }
    };

    fetchTechnicians();
  }, [transactionType]);

  // Auto-seleccionar receptor según tipo de egreso y limpiar descripción
  useEffect(() => {
    if (transactionType !== "EGRESO") return;

    // Limpiar descripción cuando cambia el tipo de egreso
    setDescription("");

    // Si NO es adelanto ni salario, el receptor es RJD
    if (expenseType !== "ADVANCE" && expenseType !== "SALARY") {
      setBeneficiary("RJD");
    } else {
      // Si es adelanto o salario y tiene RJD, limpiar para que seleccione técnico
      if (beneficiary === "RJD") {
        setBeneficiary("");
      }
    }
  }, [expenseType, transactionType, beneficiary]);

  // Efecto para cerrar modal con tecla ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLoading, onClose]);

  // Calcular descripción efectiva (usar "Adelanto" solo si el usuario no ha escrito nada)
  const effectiveDescription =
    transactionType === "EGRESO" &&
    expenseType === "ADVANCE" &&
    !description.trim()
      ? "Adelanto"
      : description;

  // Función para manejar cambio de equipo y cargar pago existente
  const handleEquipmentChange = async (newEquipmentId: string) => {
    setEquipmentId(newEquipmentId);

    if (!newEquipmentId) {
      // Limpiar campos si se deselecciona
      setTotalAmount("");
      setPaidAmount("");
      setPaymentMethod("CASH");
      setExistingPaymentId(null);
      return;
    }

    // Cargar datos del equipo incluyendo pagos
    try {
      const response = await fetch(`/api/equipments/${newEquipmentId}`);
      if (response.ok) {
        const data = await response.json();
        const equipment = data.equipment;

        if (equipment?.payments?.[0]) {
          // Tiene pago registrado - cargar los datos y guardar el ID
          const existingPayment = equipment.payments[0];
          setExistingPaymentId(existingPayment.id);
          setTotalAmount(existingPayment.totalAmount.toString());
          setPaidAmount(existingPayment.advanceAmount.toString());
          setPaymentMethod(existingPayment.paymentMethod);
        } else {
          // No tiene pago - limpiar campos
          setExistingPaymentId(null);
          setTotalAmount("");
          setPaidAmount("");
          setPaymentMethod("CASH");
        }
      }
    } catch (error) {
      console.error("Error cargando datos del equipo:", error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (transactionType === "INGRESO") {
      if (!equipmentId) newErrors.equipmentId = "Seleccione un equipo";
      if (!totalAmount || parseFloat(totalAmount) <= 0)
        newErrors.totalAmount = "El monto total debe ser mayor a 0";
      if (paidAmount && parseFloat(paidAmount) > parseFloat(totalAmount || "0"))
        newErrors.paidAmount = "El monto pagado no puede ser mayor al total";
    } else {
      if (!amount || parseFloat(amount) <= 0)
        newErrors.amount = "El monto debe ser mayor a 0";
      if (!effectiveDescription.trim())
        newErrors.description = "La descripción es obligatoria";
      // Receptor solo es requerido para ADELANTO y SALARIO
      if (
        (expenseType === "ADVANCE" || expenseType === "SALARY") &&
        !beneficiary.trim()
      )
        newErrors.beneficiary = "Seleccione un técnico";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (transactionType === "INGRESO") {
        const total = parseFloat(totalAmount);
        const paid = paidAmount ? parseFloat(paidAmount) : 0;

        if (existingPaymentId) {
          // Actualizar pago existente
          const updateData: Partial<CreatePaymentData> = {
            totalAmount: total,
            advanceAmount: paid,
            paymentMethod,
            observations: observations || undefined,
          };

          await updatePayment.mutateAsync({
            id: existingPaymentId,
            data: updateData,
          });
          toast.success("Pago actualizado correctamente");
        } else {
          // Crear nuevo pago
          const paymentData: CreatePaymentData = {
            equipmentId,
            totalAmount: total,
            advanceAmount: paid,
            paymentMethod,
            voucherType: "RECEIPT", // Siempre boleta por defecto
            paymentStatus: calculatedPaymentStatus, // Usar el estado calculado
            observations: observations || undefined,
          };

          await createPayment.mutateAsync(paymentData);
          toast.success("Pago registrado correctamente");
        }

        // Si está marcado para entregar y el pago está completo, actualizar estado del equipo
        if (markAsDelivered && calculatedPaymentStatus === "COMPLETED") {
          const statusResponse = await fetch("/api/equipments/status", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              equipmentId,
              newStatus: "DELIVERED",
              observations: "Equipo entregado - Pago completado",
            }),
          });

          if (!statusResponse.ok) {
            const errorData = await statusResponse.json();
            console.error("Error al actualizar estado:", errorData);
            throw new Error(
              errorData.error || "Error al actualizar el estado del equipo"
            );
          }

          // Invalidar queries para actualizar el sidebar y otras vistas
          queryClient.invalidateQueries({ queryKey: ["equipments"] });
          queryClient.invalidateQueries({ queryKey: ["equipment"] });

          toast.success("Equipo marcado como entregado");
        }
      } else {
        const expenseData: CreateExpenseData = {
          expenseType,
          description: effectiveDescription,
          amount: parseFloat(amount),
          beneficiary: beneficiary || undefined,
          paymentMethod: expensePaymentMethod,
          observations: observations || undefined,
        };

        await createExpense.mutateAsync(expenseData);
        toast.success("Egreso registrado correctamente");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al crear transacción:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al crear la transacción";

      toast.error(errorMessage);
      setErrors({
        submit: errorMessage,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-100">
                  Registrar Transacción
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Ingreso o egreso financiero
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6"
        >
          {/* Selector de tipo de transacción */}
          <div>
            <label className="text-sm font-medium text-slate-200 mb-3 block">
              Tipo de Transacción
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTransactionType("INGRESO")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  transactionType === "INGRESO"
                    ? "bg-green-600/20 border-green-600 text-green-400"
                    : "bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500"
                }`}
              >
                <span className="font-semibold text-lg">+ Ingreso</span>
                <p className="text-xs mt-1 opacity-80">Pago de cliente</p>
              </button>
              <button
                type="button"
                onClick={() => setTransactionType("EGRESO")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  transactionType === "EGRESO"
                    ? "bg-red-600/20 border-red-600 text-red-400"
                    : "bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500"
                }`}
              >
                <span className="font-semibold text-lg">- Egreso</span>
                <p className="text-xs mt-1 opacity-80">Gasto o pago</p>
              </button>
            </div>
          </div>

          {/* Campos para INGRESO */}
          {transactionType === "INGRESO" && (
            <>
              {/* Selector de equipo */}
              <div>
                <label className="text-sm font-medium text-slate-200 mb-2 block">
                  Equipo *
                </label>
                <select
                  value={equipmentId}
                  onChange={(e) => handleEquipmentChange(e.target.value)}
                  className={`input-dark w-full ${
                    errors.equipmentId ? "border-red-500" : ""
                  }`}
                  disabled={isLoading}
                >
                  <option value="">Seleccionar equipo...</option>
                  {equipments?.map((equip) => (
                    <option key={equip.id} value={equip.id}>
                      {equip.code} - {equip.customer?.name}
                    </option>
                  ))}
                </select>
                {errors.equipmentId && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.equipmentId}
                  </p>
                )}
              </div>

              {/* Montos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-200 mb-2 block">
                    Monto Total *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className={`input-dark w-full ${
                      errors.totalAmount ? "border-red-500" : ""
                    }`}
                    placeholder="0.00"
                    disabled={isLoading}
                  />
                  {errors.totalAmount && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.totalAmount}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-200 mb-2 block">
                    Monto Pagado
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className={`input-dark w-full ${
                      errors.paidAmount ? "border-red-500" : ""
                    }`}
                    placeholder="0.00"
                    disabled={isLoading}
                  />
                  {errors.paidAmount && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.paidAmount}
                    </p>
                  )}
                  {pendingAmount > 0 && totalAmount && (
                    <p className="text-amber-400 text-xs mt-1">
                      Pendiente: S/ {pendingAmount.toFixed(2)}
                    </p>
                  )}
                  {pendingAmount === 0 && totalAmount && paidAmount && (
                    <p className="text-green-400 text-xs mt-1">
                      ✓ Pago completo
                    </p>
                  )}
                </div>
              </div>

              {/* Método de pago */}
              <div>
                <label className="text-sm font-medium text-slate-200 mb-2 block">
                  Método de Pago *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PaymentMethod)
                  }
                  className="input-dark w-full"
                  disabled={isLoading}
                >
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado de pago automático - Solo mostrar si hay equipo seleccionado */}
              {equipmentId && (
                <div className="glass-dark p-4 rounded-lg border border-blue-600/30 bg-blue-600/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-200">
                      Estado de Pago:
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        calculatedPaymentStatus === "COMPLETED"
                          ? "text-green-400"
                          : calculatedPaymentStatus === "PARTIAL"
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {calculatedPaymentStatus === "COMPLETED" && "✓ Pagado"}
                      {calculatedPaymentStatus === "PARTIAL" &&
                        "◐ Pago Parcial"}
                      {calculatedPaymentStatus === "PENDING" && "○ Pendiente"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Se calcula automáticamente según el monto pagado
                  </p>

                  {/* Checkbox para marcar como entregado cuando el pago es completo */}
                  {calculatedPaymentStatus === "COMPLETED" && (
                    <div className="mt-3 pt-3 border-t border-blue-600/30">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={markAsDelivered}
                          onChange={(e) => setMarkAsDelivered(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-green-500 focus:ring-green-500 focus:ring-offset-slate-800"
                          disabled={isLoading}
                        />
                        <span className="text-sm text-slate-200">
                          Marcar equipo como entregado
                        </span>
                      </label>
                      <p className="text-xs text-slate-400 mt-1 ml-6">
                        El estado del equipo cambiará a &quot;Entregado&quot;
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Campos para EGRESO */}
          {transactionType === "EGRESO" && (
            <>
              {/* Tipo de egreso */}
              <div>
                <label className="text-sm font-medium text-slate-200 mb-2 block">
                  Tipo de Egreso *
                </label>
                <select
                  value={expenseType}
                  onChange={(e) =>
                    setExpenseType(e.target.value as ExpenseType)
                  }
                  className="input-dark w-full"
                  disabled={isLoading}
                >
                  {Object.entries(EXPENSE_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descripción (valor por defecto para adelantos pero editable) */}
              <div>
                <label className="text-sm font-medium text-slate-200 mb-2 block">
                  Descripción *
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`input-dark w-full ${
                    errors.description ? "border-red-500" : ""
                  }`}
                  placeholder={
                    expenseType === "ADVANCE"
                      ? "Adelanto"
                      : "Descripción del egreso"
                  }
                  disabled={isLoading}
                />
                {expenseType === "ADVANCE" && !description && (
                  <p className="text-blue-400 text-xs mt-1">
                    Se usará Adelanto por defecto si no especificas otra
                    descripción
                  </p>
                )}
                {errors.description && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Monto y Beneficiario */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-200 mb-2 block">
                    Monto *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`input-dark w-full ${
                      errors.amount ? "border-red-500" : ""
                    }`}
                    placeholder="0.00"
                    disabled={isLoading}
                  />
                  {errors.amount && (
                    <p className="text-red-400 text-xs mt-1">{errors.amount}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-200 mb-2 block">
                    Receptor{" "}
                    {(expenseType === "ADVANCE" || expenseType === "SALARY") &&
                      "*"}
                  </label>

                  {/* Selector de técnicos solo para ADELANTO y SALARIO */}
                  {expenseType === "ADVANCE" || expenseType === "SALARY" ? (
                    <>
                      <select
                        value={beneficiary}
                        onChange={(e) => setBeneficiary(e.target.value)}
                        className={`input-dark w-full ${
                          errors.beneficiary ? "border-red-500" : ""
                        }`}
                        disabled={isLoading || isLoadingTechnicians}
                      >
                        <option value="">Seleccionar técnico...</option>
                        {technicians.map((tech) => (
                          <option key={tech.id} value={tech.name}>
                            {tech.name}
                          </option>
                        ))}
                      </select>
                      {isLoadingTechnicians && (
                        <p className="text-slate-400 text-xs mt-1">
                          Cargando técnicos...
                        </p>
                      )}
                      {errors.beneficiary && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.beneficiary}
                        </p>
                      )}
                    </>
                  ) : (
                    /* Input readonly con RJD para otros tipos de egreso */
                    <>
                      <input
                        type="text"
                        value="RJD"
                        className="input-dark w-full bg-slate-700/50 cursor-not-allowed"
                        disabled
                        readOnly
                      />
                      <p className="text-slate-400 text-xs mt-1">
                        Receptor por defecto para este tipo de egreso
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Método de pago */}
              <div>
                <label className="text-sm font-medium text-slate-200 mb-2 block">
                  Método de Pago *
                </label>
                <select
                  value={expensePaymentMethod}
                  onChange={(e) =>
                    setExpensePaymentMethod(e.target.value as PaymentMethod)
                  }
                  className="input-dark w-full"
                  disabled={isLoading}
                >
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Observaciones (común para ambos) */}
          <div>
            <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-green-400" />
              Observaciones
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="input-dark w-full min-h-20 resize-y"
              placeholder="Observaciones adicionales..."
              disabled={isLoading}
            />
          </div>

          {/* Error general */}
          {errors.submit && (
            <div className="glass-dark p-4 rounded-lg border border-red-600/30 bg-red-600/10">
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-slate-700 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn-primary-dark flex-1 py-3 px-4 rounded-xl disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registrando...</span>
              </div>
            ) : (
              "Registrar Transacción"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
