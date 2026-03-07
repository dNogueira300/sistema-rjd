// src/app/dashboard/finanzas/page.tsx
"use client";

import { useState, useRef, type ReactNode } from "react";
import {
  Plus,
  Filter,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  TrendingUpDown,
  Clock,
  X,
} from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import ReactDOM from "react-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import TransactionTable from "@/components/finance/TransactionTable";
import TransactionForm from "@/components/finance/TransactionForm";
import TransactionDetailModal from "@/components/finance/TransactionDetailModal";
import PendingPaymentsModal from "@/components/finance/PendingPaymentsModal";
import {
  useTransactions,
  useFinanceMetrics,
  useUpdatePayment,
  useUpdateExpense,
} from "@/hooks/useTransactions";
import { useTechnicians } from "@/hooks/useTechnicians";
import { toast } from "sonner";
import type {
  TransactionFilters,
  TransactionType,
  ConsolidatedTransaction,
} from "@/types/finance";
import type { PaymentMethod } from "@/types/equipment";
import { PAYMENT_METHOD_LABELS } from "@/types/equipment";

export default function FinanzasPage() {
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({
    type: "ALL",
    search: "",
    paymentMethod: "ALL",
    page: 1,
    limit: 20,
    sortBy: "date",
    sortOrder: "desc",
  });

  const [selectedTransaction, setSelectedTransaction] =
    useState<ConsolidatedTransaction | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");

  // Estados para los calendarios
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const inputRef = useRef<HTMLDivElement>(null);
  const [calendarCoords, setCalendarCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const { data, isLoading, refetch } = useTransactions(filters);
  const { data: metrics } = useFinanceMetrics();
  const [showPendingModal, setShowPendingModal] = useState(false);
  const { technicians } = useTechnicians({
    initialFilters: { status: "ACTIVE" },
  });
  const updatePayment = useUpdatePayment();
  const updateExpense = useUpdateExpense();

  function handleFilterChange<K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K],
  ) {
    setFilters((prev) => {
      const next = { ...prev, [key]: value } as unknown as TransactionFilters;
      if (key !== "page") {
        next.page = 1;
      }
      return next;
    });
  }

  const handleClearFilters = () => {
    setFilters({
      type: "ALL",
      search: "",
      paymentMethod: "ALL",
      page: 1,
      limit: 20,
      sortBy: "date",
      sortOrder: "desc",
    });
  };

  const handleManageTransaction = (transaction: ConsolidatedTransaction) => {
    setSelectedTransaction(transaction);
    setModalMode("view");
  };

  const handleSaveTransaction = async (data: Record<string, unknown>) => {
    if (!selectedTransaction) return;

    try {
      if (selectedTransaction.type === "INGRESO") {
        await updatePayment.mutateAsync({
          id: selectedTransaction.id,
          data: data as {
            totalAmount?: number;
            advanceAmount?: number;
            paymentMethod?: "CASH" | "YAPE" | "PLIN" | "TRANSFER";
          },
        });
      } else {
        await updateExpense.mutateAsync({
          id: selectedTransaction.id,
          data: data as {
            description?: string;
            amount?: number;
            beneficiary?: string;
            paymentMethod?: "CASH" | "YAPE" | "PLIN" | "TRANSFER";
          },
        });
      }
      toast.success("Transacción actualizada correctamente");
      setSelectedTransaction(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al actualizar",
      );
      throw error;
    }
  };

  // Determinar si hay filtros de fecha personalizados
  const hasDateFilters = filters.startDate || filters.endDate;

  // Tipo para las tarjetas de estadística
  type Stat = {
    label: string;
    value: string | number;
    icon: ReactNode;
    iconColor: string;
    borderColor: string;
    bgColor: string;
    iconBg: string;
    highlight?: boolean;
  };

  // Stats cards cuando hay filtros de fecha (mostrar métricas del periodo)
  const periodStats: Stat[] = [
    {
      label: "Ingresos del Periodo",
      value: `S/ ${data?.periodMetrics?.income.toFixed(2) || "0.00"}`,
      icon: <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />,
      iconColor: "text-green-400",
      borderColor: "border-green-500",
      bgColor: "bg-green-600/10",
      iconBg: "bg-green-600/20",
    },
    {
      label: "Egresos del Periodo",
      value: `S/ ${data?.periodMetrics?.expenses.toFixed(2) || "0.00"}`,
      icon: <TrendingDown className="w-5 h-5 md:w-6 md:h-6" />,
      iconColor: "text-red-400",
      borderColor: "border-red-500",
      bgColor: "bg-red-600/10",
      iconBg: "bg-red-600/20",
    },
    {
      label: "Diferencia",
      value: `S/ ${data?.periodMetrics?.difference.toFixed(2) || "0.00"}`,
      icon: <DollarSign className="w-5 h-5 md:w-6 md:h-6" />,
      iconColor:
        (data?.periodMetrics?.difference || 0) >= 0
          ? "text-blue-400"
          : "text-red-400",
      borderColor:
        (data?.periodMetrics?.difference || 0) >= 0
          ? "border-blue-500"
          : "border-red-500",
      bgColor:
        (data?.periodMetrics?.difference || 0) >= 0
          ? "bg-blue-600/10"
          : "bg-red-600/10",
      iconBg:
        (data?.periodMetrics?.difference || 0) >= 0
          ? "bg-blue-600/20"
          : "bg-red-600/20",
    },
  ];

  // Stats cards cuando NO hay filtros de fecha (mostrar métricas generales)
  const generalStats: Stat[] = [
    {
      label: "Ingresos del Día",
      value: `S/ ${metrics?.todayIncome.toFixed(2) || "0.00"}`,
      icon: <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />,
      iconColor: "text-green-400",
      borderColor: "border-green-500",
      bgColor: "bg-green-600/10",
      iconBg: "bg-green-600/20",
    },
    {
      label: "Egresos del Día",
      value: `S/ ${metrics?.todayExpenses.toFixed(2) || "0.00"}`,
      icon: <TrendingDown className="w-5 h-5 md:w-6 md:h-6" />,
      iconColor: "text-red-400",
      borderColor: "border-red-500",
      bgColor: "bg-red-600/10",
      iconBg: "bg-red-600/20",
    },
    {
      label: "Balance del Día",
      value: `S/ ${metrics?.balance.toFixed(2) || "0.00"}`,
      icon: <DollarSign className="w-5 h-5 md:w-6 md:h-6" />,
      iconColor:
        (metrics?.balance || 0) >= 0 ? "text-blue-400" : "text-red-400",
      borderColor:
        (metrics?.balance || 0) >= 0 ? "border-blue-500" : "border-red-500",
      bgColor:
        (metrics?.balance || 0) >= 0 ? "bg-blue-600/10" : "bg-red-600/10",
      iconBg: (metrics?.balance || 0) >= 0 ? "bg-blue-600/20" : "bg-red-600/20",
    },
    {
      label: "Rentabilidad Mes",
      value: `${metrics?.monthlyProfitability.toFixed(1) || "0.0"}%`,
      icon: <TrendingUpDown className="w-5 h-5 md:w-6 md:h-6" />,
      iconColor:
        (metrics?.monthlyProfitability || 0) >= 0
          ? "text-purple-400"
          : "text-red-400",
      borderColor:
        (metrics?.monthlyProfitability || 0) >= 0
          ? "border-purple-500"
          : "border-red-500",
      bgColor:
        (metrics?.monthlyProfitability || 0) >= 0
          ? "bg-purple-600/10"
          : "bg-red-600/10",
      iconBg:
        (metrics?.monthlyProfitability || 0) >= 0
          ? "bg-purple-600/20"
          : "bg-red-600/20",
    },
    {
      label: "Pagos Pendientes",
      value: metrics?.pendingPayments || 0,
      icon: <Clock className="w-5 h-5 md:w-6 md:h-6" />,
      iconColor: "text-amber-400",
      borderColor: "border-amber-500",
      bgColor: "bg-amber-600/10",
      iconBg: "bg-amber-600/20",
      highlight: (metrics?.pendingPayments || 0) > 0,
    },
  ];

  // Seleccionar las estadísticas a mostrar según si hay filtros de fecha
  const stats: Stat[] = hasDateFilters ? periodStats : generalStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-dark p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-linear-to-br from-green-600 to-green-700">
              <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-100">
                Gestión Financiera
              </h2>
              <p className="text-sm text-slate-400">
                Control de ingresos y egresos del sistema
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary-dark flex items-center justify-center gap-2 px-4 py-2 w-full md:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Nueva Transacción</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        className={`grid ${
          hasDateFilters
            ? "grid-cols-1 md:grid-cols-3"
            : "grid-cols-2 md:grid-cols-5"
        } gap-3 md:gap-4`}
      >
        {stats.map((stat, index) => {
          const isPendingCard = stat.label === "Pagos Pendientes";
          return (
            <div
              key={index}
              onClick={
                isPendingCard ? () => setShowPendingModal(true) : undefined
              }
              className={`card-dark p-3 md:p-4 hover-lift border-2 ${stat.borderColor} ${stat.bgColor} ${
                stat.highlight ? "ring-2 ring-amber-500/50 animate-pulse" : ""
              } ${isPendingCard ? "cursor-pointer" : ""}`}
            >
              <div className="flex items-center gap-2 md:gap-3">
                <div
                  className={`p-2 md:p-3 rounded-lg ${stat.iconBg} shrink-0`}
                >
                  <span className={stat.iconColor}>{stat.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-lg md:text-2xl font-bold text-slate-100 truncate">
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="card-dark p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-100">Filtros</h2>
          </div>
          <button
            onClick={handleClearFilters}
            className="btn-secondary-dark flex items-center gap-2 px-3 py-1.5 text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 active:scale-95 group"
          >
            <X className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
            <span className="hidden sm:inline">Limpiar Filtros</span>
          </button>
        </div>

        {/* Primera fila: Filtros principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tipo */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Tipo
            </label>
            <select
              value={filters.type}
              onChange={(e) =>
                handleFilterChange(
                  "type",
                  e.target.value as TransactionType | "ALL",
                )
              }
              className="input-dark w-full h-12"
            >
              <option value="ALL">Todos</option>
              <option value="INGRESO">Ingresos</option>
              <option value="EGRESO">Egresos</option>
            </select>
          </div>

          {/* Método de pago */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Método de Pago
            </label>
            <select
              value={filters.paymentMethod}
              onChange={(e) =>
                handleFilterChange(
                  "paymentMethod",
                  e.target.value as PaymentMethod | "ALL",
                )
              }
              className="input-dark w-full h-12"
            >
              <option value="ALL">Todos</option>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Técnico */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Técnico
            </label>
            <select
              value={filters.technicianId || ""}
              onChange={(e) =>
                handleFilterChange("technicianId", e.target.value || undefined)
              }
              className="input-dark w-full h-12"
            >
              <option value="">Todos los técnicos</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rango de fechas */}
          <div className="relative overflow-visible">
            <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <Calendar
                className="w-4 h-4 text-blue-400 cursor-pointer"
                onClick={() => {
                  if (showCalendar) {
                    setShowCalendar(false);
                  } else if (inputRef.current) {
                    const rect = inputRef.current.getBoundingClientRect();
                    setCalendarCoords({
                      top: rect.bottom + window.scrollY,
                      left: rect.left + window.scrollX,
                      width: rect.width,
                    });
                    setShowCalendar(true);
                  } else {
                    setShowCalendar(true);
                  }
                }}
              />
              Rango de fechas
            </label>
            <div
              ref={inputRef}
              className="input-dark w-full flex justify-between items-center cursor-pointer h-12"
              onClick={() => {
                if (showCalendar) {
                  setShowCalendar(false);
                } else if (inputRef.current) {
                  const rect = inputRef.current.getBoundingClientRect();
                  setCalendarCoords({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                  });
                  setShowCalendar(true);
                } else {
                  setShowCalendar(true);
                }
              }}
            >
              {selectedRange && selectedRange.from && selectedRange.to ? (
                <div className="w-full">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Inicio</span>
                    <span>Fin</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-100">
                    <span>{format(selectedRange.from, "dd/MM/yyyy")}</span>
                    <span>{format(selectedRange.to, "dd/MM/yyyy")}</span>
                  </div>
                </div>
              ) : (
                <>
                  <span className="truncate text-slate-400">
                    Seleccionar rango
                  </span>
                  <Calendar className="w-4 h-4 text-slate-300" />
                </>
              )}
            </div>

            {showCalendar &&
              calendarCoords &&
              ReactDOM.createPortal(
                <div
                  style={{
                    position: "absolute",
                    top: calendarCoords.top,
                    left: calendarCoords.left,
                    zIndex: 10000,
                  }}
                >
                  <DayPicker
                    mode="range"
                    selected={selectedRange}
                    onSelect={(range) => {
                      setSelectedRange((prev) => {
                        const r = range as DateRange;
                        if (r.from && r.to && (prev?.from || prev?.to)) {
                          handleFilterChange("startDate", r.from);
                          handleFilterChange("endDate", r.to);
                          setShowCalendar(false);
                        }
                        return r;
                      });
                    }}
                    locale={es}
                    classNames={{
                      today: "ring-2 ring-blue-400 rounded-full",
                      range_start: "!bg-blue-600 !text-white rounded-l-full",
                      range_end: "!bg-blue-600 !text-white rounded-r-full",
                      range_middle: "!bg-blue-400/30",
                    }}
                    className="bg-slate-800 p-2 rounded-lg"
                  />
                </div>,
                document.body,
              )}
          </div>
        </div>

        {/* Segunda fila: Búsqueda */}
        <div className="grid grid-cols-1 gap-4 mt-4">
          {/* Búsqueda */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="Descripción, equipo, cliente..."
                className="input-dark-with-icon w-full text-sm md:text-base h-12"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de transacciones */}
      <div className="space-y-4">
        {/* Información de paginación */}
        <div className="card-dark p-4 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Mostrando{" "}
            <span className="font-medium text-slate-200">
              {(filters.page - 1) * filters.limit + 1}-
              {Math.min(filters.page * filters.limit, data?.total || 0)}
            </span>{" "}
            de{" "}
            <span className="font-medium text-slate-200">
              {data?.total || 0}
            </span>{" "}
            registros
          </div>
          <div className="flex items-center gap-2">
            {/* Selector de registros por página */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Mostrar</label>
              <select
                value={filters.limit}
                onChange={(e) =>
                  handleFilterChange("limit", Number(e.target.value))
                }
                className="input-dark w-20 text-sm h-12"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <button
              onClick={() =>
                handleFilterChange("page", Math.max(1, filters.page - 1))
              }
              disabled={!data?.hasPreviousPage}
              className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-slate-600 transition-colors text-sm font-medium h-12"
            >
              Anterior
            </button>
            <div className="text-sm text-slate-400">
              Página{" "}
              <span className="font-medium text-slate-200">{filters.page}</span>{" "}
              de{" "}
              <span className="font-medium text-slate-200">
                {data?.totalPages || 1}
              </span>
            </div>
            <button
              onClick={() =>
                handleFilterChange("page", (filters.page || 1) + 1)
              }
              disabled={!data?.hasNextPage}
              className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-slate-600 transition-colors text-sm font-medium h-12"
            >
              Siguiente
            </button>
          </div>
        </div>

        {/* Tabla */}
        <TransactionTable
          transactions={data?.transactions || []}
          isLoading={isLoading}
          onManage={handleManageTransaction}
        />

        {/* Información de paginación inferior */}
        {data && data.totalPages > 1 && (
          <div className="card-dark p-4 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Total:{" "}
              <span className="font-medium text-slate-200">{data.total}</span>{" "}
              registros
            </div>
            <div className="flex items-center gap-2">
              {/* Selector de registros por página (inferior) */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Mostrar</label>
                <select
                  value={filters.limit}
                  onChange={(e) =>
                    handleFilterChange("limit", Number(e.target.value))
                  }
                  className="input-dark w-20 text-sm h-12"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <button
                onClick={() =>
                  handleFilterChange("page", Math.max(1, filters.page - 1))
                }
                disabled={!data.hasPreviousPage}
                className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-slate-600 transition-colors text-sm font-medium h-12"
              >
                Anterior
              </button>
              <button
                onClick={() =>
                  handleFilterChange("page", (filters.page || 1) + 1)
                }
                disabled={!data.hasNextPage}
                className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-slate-600 transition-colors text-sm font-medium h-12"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <TransactionForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            refetch();
            setShowForm(false);
          }}
        />
      )}

      {/* Modal de detalle/edición */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          mode={modalMode}
          onClose={() => setSelectedTransaction(null)}
          onSave={handleSaveTransaction}
          isSaving={updatePayment.isPending || updateExpense.isPending}
        />
      )}

      {/* Modal de Pagos Pendientes (abrido desde la tarjeta) */}
      {showPendingModal && (
        <PendingPaymentsModal
          isOpen={showPendingModal}
          onClose={() => setShowPendingModal(false)}
        />
      )}
    </div>
  );
}
