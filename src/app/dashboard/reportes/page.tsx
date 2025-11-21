// src/app/dashboard/reportes/page.tsx
import { BarChart3, Download, FileText, Calendar } from "lucide-react";

const reportTypes = [
  {
    title: "Reporte de Equipos",
    description: "Estado y actividad de equipos",
    icon: FileText,
    count: "42 equipos",
    color: "from-blue-600 to-blue-700",
  },
  {
    title: "Reporte Financiero",
    description: "Ingresos y gastos del período",
    icon: BarChart3,
    count: "$45,230",
    color: "from-green-600 to-green-700",
  },
  {
    title: "Reporte de Reparaciones",
    description: "Órdenes de trabajo completadas",
    icon: FileText,
    count: "156 trabajos",
    color: "from-orange-600 to-orange-700",
  },
  {
    title: "Reporte Mensual",
    description: "Resumen general del mes",
    icon: Calendar,
    count: "Noviembre 2024",
    color: "from-purple-600 to-purple-700",
  },
];

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-dark p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-linear-to-br from-purple-600 to-purple-700">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100">
                Centro de Reportes
              </h2>
              <p className="text-slate-400">
                Genera y descarga informes detallados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="card-dark p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              className="input-dark w-full"
              defaultValue="2024-11-01"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              className="input-dark w-full"
              defaultValue="2024-11-20"
            />
          </div>
          <div className="pt-8">
            <button className="btn-primary-dark">Aplicar Filtro</button>
          </div>
        </div>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report, index) => {
          const Icon = report.icon;
          return (
            <div key={index} className="card-dark p-6 hover-lift">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-lg bg-linear-to-br ${report.color}`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <button className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors">
                  <Download className="w-5 h-5 text-white" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-2">
                {report.title}
              </h3>
              <p className="text-sm text-slate-400 mb-3">
                {report.description}
              </p>
              <div className="pt-3 border-t border-slate-700">
                <p className="text-sm font-medium text-slate-300">
                  {report.count}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Reports */}
      <div className="card-dark p-6">
        <h3 className="text-xl font-bold text-slate-100 mb-4">
          Reportes Generados Recientemente
        </h3>
        <div className="space-y-3">
          {[
            {
              name: "Reporte Mensual - Noviembre 2024",
              date: "2024-11-20",
              size: "2.3 MB",
            },
            {
              name: "Estado de Equipos - Semanal",
              date: "2024-11-18",
              size: "1.8 MB",
            },
            {
              name: "Reporte Financiero - Q4",
              date: "2024-11-15",
              size: "3.1 MB",
            },
          ].map((report, index) => (
            <div
              key={index}
              className="glass-dark p-4 rounded-lg border border-slate-700 flex items-center justify-between hover:border-purple-600 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-purple-600/20">
                  <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100">
                    {report.name}
                  </h4>
                  <p className="text-sm text-slate-400">
                    {report.date} • {report.size}
                  </p>
                </div>
              </div>
              <button className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors">
                <Download className="w-5 h-5 text-slate-300" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
