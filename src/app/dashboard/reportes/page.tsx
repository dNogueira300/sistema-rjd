// src/app/dashboard/reportes/page.tsx
"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFinancialReport, useTechnicianPayments } from "@/hooks/useReports";
import { useTechnicians } from "@/hooks/useTechnicians";
import MetricCard from "@/components/reports/MetricCard";
import LineChart from "@/components/reports/LineChart";
import TechnicianPaymentsTable from "@/components/reports/TechnicianPaymentsTable";
import TechnicianPaymentsChart from "@/components/reports/TechnicianPaymentsChart";
import PaymentCalculatorModal from "@/components/reports/PaymentCalculatorModal";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  TrendingUpDown,
  AlertTriangle,
  Download,
  Calendar,
  Users,
  Filter,
  X,
  Calculator,
} from "lucide-react";
import { formatCurrency } from "@/lib/reports";
import { generateFinancialReportPDF, generateTechnicianReportPDF } from "@/lib/report-pdf-generator";
import { toast } from "sonner";

type PeriodType = "today" | "week" | "month" | "custom";

export default function ReportesPage() {
  const [period, setPeriod] = useState<PeriodType>("custom");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>("");

  // Estados para filtros aplicados (solo se actualizan al hacer clic en Aplicar)
  const [appliedPeriod, setAppliedPeriod] = useState<PeriodType>("custom");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [appliedTechnicianId, setAppliedTechnicianId] = useState<string>("");

  // Estado para el modal de cálculo de pago
  const [showPaymentCalculator, setShowPaymentCalculator] = useState(false);

  const queryClient = useQueryClient();
  const { technicians } = useTechnicians();

  // Calcular fechas según el período APLICADO o fechas personalizadas APLICADAS
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Si el período aplicado es "custom", usar las fechas personalizadas aplicadas
    if (appliedPeriod === "custom") {
      // Si no hay fechas aplicadas, no aplicar filtros de fecha (mostrar todo)
      if (!appliedStartDate || !appliedEndDate) {
        return undefined;
      }
      return {
        startDate: appliedStartDate,
        endDate: appliedEndDate,
      };
    }

    // Usar el período aplicado
    switch (appliedPeriod) {
      case "today":
        return {
          startDate: today.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
        };
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return {
          startDate: weekStart.toISOString().split("T")[0],
          endDate: now.toISOString().split("T")[0],
        };
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          startDate: monthStart.toISOString().split("T")[0],
          endDate: now.toISOString().split("T")[0],
        };
      default:
        return undefined;
    }
  };

  const dateRange = getDateRange();

  // Construir filtros para la API
  const filters: {
    startDate?: string;
    endDate?: string;
    technicianId?: string;
  } = {};

  if (dateRange) {
    filters.startDate = dateRange.startDate;
    filters.endDate = dateRange.endDate;
  }

  if (appliedTechnicianId) {
    filters.technicianId = appliedTechnicianId;
  }

  const { data, isLoading, error } = useFinancialReport(filters);
  const { data: paymentsData } = useTechnicianPayments(filters);

  const handleApplyFilters = () => {
    if (customStartDate && customEndDate) {
      if (new Date(customStartDate) > new Date(customEndDate)) {
        toast.error("La fecha de inicio debe ser menor o igual a la fecha fin");
        return;
      }
      // Aplicar los filtros personalizados
      setAppliedPeriod("custom");
      setAppliedStartDate(customStartDate);
      setAppliedEndDate(customEndDate);
      setAppliedTechnicianId(selectedTechnicianId);
      setPeriod("custom"); // Sincronizar el selector
      toast.success("Filtros aplicados");
    } else {
      toast.error("Debe seleccionar ambas fechas para el filtro personalizado");
    }
  };

  const handleClearFilters = () => {
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedTechnicianId("");
    setPeriod("custom");
    // Limpiar filtros aplicados
    setAppliedPeriod("custom");
    setAppliedStartDate("");
    setAppliedEndDate("");
    setAppliedTechnicianId("");
    toast.success("Filtros limpiados");
  };

  const getPeriodLabel = () => {
    // Usar etiquetas del período APLICADO
    switch (appliedPeriod) {
      case "today":
        return {
          main: "del Día",
          income: "Ingresos Hoy",
          expenses: "Gastos Hoy",
          difference: "Diferencia Hoy",
        };
      case "week":
        return {
          main: "de la Semana",
          income: "Ingresos de la Semana",
          expenses: "Gastos de la Semana",
          difference: "Diferencia de la Semana",
        };
      case "custom":
        // Si no hay fechas aplicadas, mostrar etiquetas genéricas
        if (!appliedStartDate || !appliedEndDate) {
          return {
            main: "Total",
            income: "Ingresos Totales",
            expenses: "Gastos Totales",
            difference: "Diferencia Total",
          };
        }
        // Si ambas fechas aplicadas son iguales, es un día específico
        if (appliedStartDate === appliedEndDate) {
          return {
            main: "del Día",
            income: "Ingresos del Día",
            expenses: "Gastos del Día",
            difference: "Diferencia del Día",
          };
        }
        // Fechas diferentes = período personalizado
        return {
          main: "del Período",
          income: "Ingresos del Período",
          expenses: "Egresos del Período",
          difference: "Diferencia del Período",
        };
      case "month":
      default:
        return {
          main: "del Mes",
          income: "Ingresos del Mes",
          expenses: "Gastos del Mes",
          difference: "Diferencia del Mes",
        };
    }
  };

  const labels = getPeriodLabel();

  // Verificar si hay filtro personalizado aplicado
  const hasCustomFilterApplied =
    appliedPeriod === "custom" && appliedStartDate && appliedEndDate;
  const hasAnyFilterApplied =
    appliedPeriod !== "custom" || hasCustomFilterApplied;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando reportes financieros...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-dark p-6">
        <div className="text-center text-red-400">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
          <p>Error cargando reportes: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, dailyRevenue, technicianExpenses } = data;

  const handleExportPDF = () => {
    try {
      let pdfBuffer: ArrayBuffer;
      let fileName: string;

      if (appliedTechnicianId && paymentsData?.payments) {
        // Generar PDF filtrado por técnico
        const selectedTech = technicians?.find((t) => t.id === appliedTechnicianId);
        const techName = selectedTech?.name || "Técnico";
        pdfBuffer = generateTechnicianReportPDF(
          techName,
          paymentsData.payments,
          dateRange
            ? { startDate: dateRange.startDate, endDate: dateRange.endDate }
            : undefined
        );
        fileName = `reporte-tecnico-${techName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
      } else {
        // Generar PDF financiero completo
        pdfBuffer = generateFinancialReportPDF(
          data,
          {
            income: labels.income,
            expenses: labels.expenses,
            difference: labels.difference,
          },
          dateRange
            ? {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
              }
            : undefined,
          paymentsData?.payments || []
        );
        fileName = `reporte-financiero-${new Date().toISOString().split("T")[0]}.pdf`;
      }

      const blob = new Blob([pdfBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Reporte PDF generado exitosamente");
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast.error("Error al generar el reporte PDF");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Reportes Financieros
          </h1>
          <p className="text-slate-400 mt-1">
            Análisis de ingresos, gastos y rentabilidad
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasCustomFilterApplied && (
            <button
              onClick={() => setShowPaymentCalculator(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-2 border-purple-500 hover:border-purple-400 text-slate-100 font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 active:scale-95 flex items-center gap-2 group"
            >
              <Calculator className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
              <span className="hidden sm:inline">Calcular Pago</span>
              <span className="sm:hidden">Calcular</span>
            </button>
          )}
          <button
            onClick={handleExportPDF}
            className="btn-primary-dark flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card-dark p-4 border-2 border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-slate-100">Filtros</h3>
          </div>
          <button
            onClick={handleClearFilters}
            className="btn-secondary-dark flex items-center gap-2 px-3 py-1.5 text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 active:scale-95 group"
          >
            <X className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
            <span className="hidden sm:inline">Limpiar Filtros</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Filtro de Período */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Calendar className="w-4 h-4" />
              Período
            </label>
            <select
              value={period}
              onChange={(e) => {
                const newPeriod = e.target.value as PeriodType;
                setPeriod(newPeriod);
                // Si cambia a un período predefinido (no custom), aplicar inmediatamente
                if (newPeriod !== "custom") {
                  setCustomStartDate("");
                  setCustomEndDate("");
                  setAppliedPeriod(newPeriod);
                  setAppliedStartDate("");
                  setAppliedEndDate("");
                  setAppliedTechnicianId(selectedTechnicianId);
                }
              }}
              className="input-dark w-full"
            >
              <option value="today">Hoy</option>
              <option value="week">Última Semana</option>
              <option value="month">Este Mes</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {/* Fechas personalizadas - siempre visibles */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="input-dark w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Fecha Fin
            </label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="input-dark w-full"
            />
          </div>

          {/* Filtro de Técnico */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Users className="w-4 h-4" />
              Técnico
            </label>
            <select
              value={selectedTechnicianId}
              onChange={(e) => setSelectedTechnicianId(e.target.value)}
              className="input-dark w-full"
            >
              <option value="">Todos los técnicos</option>
              {technicians
                ?.filter((t) => t.status === "ACTIVE")
                .map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Botón Aplicar Filtro */}
          <div className="flex items-end">
            <button
              onClick={handleApplyFilters}
              className="btn-primary-dark w-full"
            >
              Aplicar Filtro
            </button>
          </div>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <MetricCard
          title="Ingresos Hoy"
          value={formatCurrency(kpis.todayIncome)}
          icon={DollarSign}
          iconColor="text-green-400"
          borderColor="border-green-500"
          bgColor="bg-green-600/10"
          iconBg="bg-green-600/20"
          subtitle="Ingresos del día"
        />
        <MetricCard
          title="Egresos Hoy"
          value={formatCurrency(kpis.todayExpenses)}
          icon={TrendingDown}
          iconColor="text-red-400"
          borderColor="border-red-500"
          bgColor="bg-red-600/10"
          iconBg="bg-red-600/20"
          subtitle="Gastos del día"
        />
        <MetricCard
          title={labels.income}
          value={hasAnyFilterApplied ? formatCurrency(kpis.monthIncome) : "—"}
          icon={TrendingUp}
          iconColor="text-blue-400"
          borderColor="border-blue-500"
          bgColor="bg-blue-600/10"
          iconBg="bg-blue-600/20"
          subtitle={
            hasAnyFilterApplied ? "Según filtro" : "Sin filtro aplicado"
          }
        />
        <MetricCard
          title={labels.expenses}
          value={hasAnyFilterApplied ? formatCurrency(kpis.monthExpenses) : "—"}
          icon={TrendingDown}
          iconColor="text-orange-400"
          borderColor="border-orange-500"
          bgColor="bg-orange-600/10"
          iconBg="bg-orange-600/20"
          subtitle={
            hasAnyFilterApplied ? "Según filtro" : "Sin filtro aplicado"
          }
        />
        <MetricCard
          title={labels.difference}
          value={hasAnyFilterApplied ? formatCurrency(kpis.monthProfit) : "—"}
          icon={TrendingUpDown}
          iconColor={kpis.monthProfit >= 0 ? "text-purple-400" : "text-red-400"}
          borderColor={
            kpis.monthProfit >= 0 ? "border-purple-500" : "border-red-500"
          }
          bgColor={kpis.monthProfit >= 0 ? "bg-purple-600/10" : "bg-red-600/10"}
          iconBg={kpis.monthProfit >= 0 ? "bg-purple-600/20" : "bg-red-600/20"}
          subtitle={
            hasAnyFilterApplied
              ? `Hoy: ${formatCurrency(kpis.todayProfit)}`
              : "Sin filtro aplicado"
          }
        />
      </div>

      {/* Gráfico de Ingresos vs Gastos */}
      <div className="card-dark p-6 border-2 border-slate-700 overflow-hidden">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">
          Ingresos vs Gastos
        </h3>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <LineChart data={dailyRevenue} />
          </div>
        </div>
      </div>

      {/* Egresos de Técnicos (Adelantos y Salarios) */}
      {technicianExpenses && technicianExpenses.length > 0 && (
        <div className="card-dark p-6 border-2 border-slate-700">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">
            Egresos de Técnicos (Resumen)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                    Técnico
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">
                    Adelantos
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-300">
                    N° Adelantos
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">
                    Salarios
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-300">
                    N° Salarios
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">
                    Total Egresos
                  </th>
                </tr>
              </thead>
              <tbody>
                {technicianExpenses.map((tech) => (
                  <tr
                    key={tech.technicianId}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-medium text-slate-100">
                      {tech.technicianName}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium text-orange-400">
                      {formatCurrency(tech.totalAdvances)}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-slate-300">
                      {tech.advanceCount}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium text-blue-400">
                      {formatCurrency(tech.totalSalaries)}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-slate-300">
                      {tech.salaryCount}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-bold text-red-400">
                      {formatCurrency(tech.totalExpenses)}
                    </td>
                  </tr>
                ))}
                {/* Fila de totales */}
                <tr className="border-t-2 border-slate-600 bg-slate-700/30 font-bold">
                  <td className="py-3 px-4 text-sm text-slate-100">TOTAL</td>
                  <td className="py-3 px-4 text-right text-sm text-orange-400">
                    {formatCurrency(
                      technicianExpenses.reduce(
                        (sum, t) => sum + t.totalAdvances,
                        0
                      )
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-slate-300">
                    {technicianExpenses.reduce(
                      (sum, t) => sum + t.advanceCount,
                      0
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-blue-400">
                    {formatCurrency(
                      technicianExpenses.reduce(
                        (sum, t) => sum + t.totalSalaries,
                        0
                      )
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-slate-300">
                    {technicianExpenses.reduce(
                      (sum, t) => sum + t.salaryCount,
                      0
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-red-400">
                    {formatCurrency(
                      technicianExpenses.reduce(
                        (sum, t) => sum + t.totalExpenses,
                        0
                      )
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla de Pagos Detallados a Técnicos y Gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabla a la izquierda */}
        <TechnicianPaymentsTable
          startDate={filters.startDate}
          endDate={filters.endDate}
          technicianId={filters.technicianId}
        />

        {/* Gráfico a la derecha */}
        <TechnicianPaymentsChart
          startDate={filters.startDate}
          endDate={filters.endDate}
          technicianId={filters.technicianId}
        />
      </div>

      {/* Modal de Calculadora de Pago */}
      {showPaymentCalculator && (
        <PaymentCalculatorModal
          onClose={() => setShowPaymentCalculator(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["financial-report"] });
            queryClient.invalidateQueries({ queryKey: ["technician-payments"] });
          }}
          totalIncome={kpis.monthIncome}
          totalExpenses={kpis.monthExpenses}
          periodLabel={labels.income}
          technicianPayments={paymentsData?.payments || []}
        />
      )}
    </div>
  );
}
