// src/app/dashboard/page.tsx
"use client";

import { useOperationalReport } from "@/hooks/useReports";
import MetricCard from "@/components/reports/MetricCard";
import DonutChart from "@/components/reports/DonutChart";
import TechnicianTable from "@/components/reports/TechnicianTable";
import {
  Package,
  Wrench,
  CheckCircle,
  TruckIcon,
  Clock,
  AlertTriangle,
  Download,
} from "lucide-react";
import { formatNumber } from "@/lib/reports";
import { generateOperationalReportPDF } from "@/lib/report-pdf-generator";
import { toast } from "sonner";

export default function DashboardPage() {
  const { data, isLoading, error } = useOperationalReport({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-dark p-6">
        <div className="text-center text-red-400">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
          <p>Error cargando dashboard: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    metrics,
    equipmentsByStatus,
    technicianPerformance,
    repairTimes,
    overdueEquipments,
  } = data;

  const handleExportPDF = () => {
    try {
      const pdfBuffer = generateOperationalReportPDF(data);
      const blob = new Blob([pdfBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte-operativo-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Dashboard Operativo
          </h1>
          <p className="text-slate-400 mt-1">
            Métricas y estadísticas en tiempo real
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          className="btn-primary-dark flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar PDF
        </button>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title="Total Equipos"
          value={formatNumber(metrics.totalEquipments)}
          icon={Package}
          iconColor="text-blue-400"
          borderColor="border-blue-500"
          bgColor="bg-blue-600/10"
          iconBg="bg-blue-600/20"
          subtitle="Todos los equipos"
        />
        <MetricCard
          title="En Reparación"
          value={formatNumber(metrics.inRepair)}
          icon={Wrench}
          iconColor="text-orange-400"
          borderColor="border-orange-500"
          bgColor="bg-orange-600/10"
          iconBg="bg-orange-600/20"
          subtitle="Recibidos + En Reparación"
        />
        <MetricCard
          title="Listos para Entrega"
          value={formatNumber(metrics.readyForDelivery)}
          icon={CheckCircle}
          iconColor="text-green-400"
          borderColor="border-green-500"
          bgColor="bg-green-600/10"
          iconBg="bg-green-600/20"
          subtitle="Reparados"
        />
        <MetricCard
          title="Entregados"
          value={formatNumber(metrics.delivered)}
          icon={TruckIcon}
          iconColor="text-purple-400"
          borderColor="border-purple-500"
          bgColor="bg-purple-600/10"
          iconBg="bg-purple-600/20"
          subtitle="Completados"
        />
      </div>

      {/* Gráficos y Tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Estado */}
        <DonutChart data={equipmentsByStatus} title="Distribución por Estado" />

        {/* Tiempos de Reparación */}
        <div className="card-dark p-6 border-2 border-slate-700">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Tiempos de Reparación
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Promedio:</span>
              <span className="text-2xl font-bold text-slate-100">
                {repairTimes.averageDays} días
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Mediana:</span>
              <span className="text-slate-300">
                {repairTimes.medianDays} días
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Mínimo:</span>
              <span className="text-green-400">{repairTimes.minDays} días</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Máximo:</span>
              <span className="text-red-400">{repairTimes.maxDays} días</span>
            </div>
            <div className="pt-4 border-t border-slate-700">
              <span className="text-xs text-slate-500">
                Basado en {repairTimes.total} equipos entregados
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas de Equipos Vencidos */}
      {overdueEquipments.length > 0 && (
        <div className="card-dark p-6 border-2 border-red-500/30 bg-red-600/5">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Equipos Vencidos
            <span className="ml-auto text-sm font-normal text-slate-400">
              {overdueEquipments.length} equipos &gt;14 días
            </span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-sm font-medium text-slate-300">
                    Código
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-slate-300">
                    Cliente
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-slate-300">
                    Técnico
                  </th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-slate-300">
                    Días
                  </th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-slate-300">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {overdueEquipments.slice(0, 10).map((eq) => (
                  <tr key={eq.id} className="border-b border-slate-700/50">
                    <td className="py-2 px-3 text-sm font-mono text-blue-400">
                      {eq.code}
                    </td>
                    <td className="py-2 px-3 text-sm text-slate-300">
                      {eq.customerName}
                    </td>
                    <td className="py-2 px-3 text-sm text-slate-300">
                      {eq.technicianName || "-"}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          eq.daysInRepair > 30
                            ? "bg-red-600/20 text-red-400"
                            : eq.daysInRepair > 21
                            ? "bg-orange-600/20 text-orange-400"
                            : "bg-yellow-600/20 text-yellow-400"
                        }`}
                      >
                        {eq.daysInRepair} días
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center text-sm text-slate-400">
                      REPAIR
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla de Técnicos */}
      <TechnicianTable
        data={technicianPerformance}
        title="Rendimiento de Técnicos"
      />
    </div>
  );
}
