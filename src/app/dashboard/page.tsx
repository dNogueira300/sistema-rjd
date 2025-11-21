// src/app/dashboard/page.tsx
import { Laptop, Wrench, CheckCircle, AlertTriangle } from "lucide-react";

const stats = [
  {
    title: "Equipos Activos",
    value: "42",
    description: "En funcionamiento",
    icon: Laptop,
    color: "from-blue-600 to-blue-700",
    bgColor: "bg-blue-600/10",
    borderColor: "border-blue-600/30",
  },
  {
    title: "En Reparación",
    value: "8",
    description: "Requieren atención",
    icon: Wrench,
    color: "from-orange-600 to-orange-700",
    bgColor: "bg-orange-600/10",
    borderColor: "border-orange-600/30",
  },
  {
    title: "Completados",
    value: "156",
    description: "Este mes",
    icon: CheckCircle,
    color: "from-green-600 to-green-700",
    bgColor: "bg-green-600/10",
    borderColor: "border-green-600/30",
  },
  {
    title: "Pendientes",
    value: "12",
    description: "Por asignar",
    icon: AlertTriangle,
    color: "from-yellow-600 to-yellow-700",
    bgColor: "bg-yellow-600/10",
    borderColor: "border-yellow-600/30",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card-dark p-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          Bienvenido al Sistema RJD
        </h2>
        <p className="text-slate-400">
          Gestión integral de equipos, finanzas y reportes
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`card-dark p-6 hover-lift ${stat.bgColor} border-2 ${stat.borderColor}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-linear-to-br ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-100 mb-1">
                  {stat.value}
                </h3>
                <p className="text-sm font-medium text-slate-300 mb-1">
                  {stat.title}
                </p>
                <p className="text-xs text-slate-400">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions Section */}
      <div className="card-dark p-6">
        <h3 className="text-xl font-bold text-slate-100 mb-4">
          Accesos Rápidos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-primary-dark text-left">
            <div className="flex items-center gap-3">
              <Laptop className="w-5 h-5" />
              <div>
                <p className="font-semibold">Nuevo Equipo</p>
                <p className="text-xs opacity-80">Registrar equipo</p>
              </div>
            </div>
          </button>
          <button className="btn-primary-dark text-left">
            <div className="flex items-center gap-3">
              <Wrench className="w-5 h-5" />
              <div>
                <p className="font-semibold">Nueva Reparación</p>
                <p className="text-xs opacity-80">Crear orden de trabajo</p>
              </div>
            </div>
          </button>
          <button className="btn-primary-dark text-left">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Ver Reportes</p>
                <p className="text-xs opacity-80">Generar informes</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
