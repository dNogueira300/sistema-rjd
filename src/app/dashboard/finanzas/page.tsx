// src/app/dashboard/finanzas/page.tsx
import { DollarSign, TrendingUp, TrendingDown, Calendar } from "lucide-react";

const financialStats = [
  {
    title: "Ingresos Totales",
    value: "$45,230",
    change: "+12.5%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    title: "Gastos Totales",
    value: "$28,450",
    change: "-8.3%",
    trend: "down",
    icon: TrendingDown,
  },
  {
    title: "Balance",
    value: "$16,780",
    change: "+20.8%",
    trend: "up",
    icon: DollarSign,
  },
];

export default function FinanzasPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-dark p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-linear-to-br from-green-600 to-green-700">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100">
                Gestión Financiera
              </h2>
              <p className="text-slate-400">Control de ingresos y gastos</p>
            </div>
          </div>
          <button className="btn-primary-dark flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Este Mes
          </button>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {financialStats.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.trend === "up";
          return (
            <div key={index} className="card-dark p-6 hover-lift">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-lg ${
                    isPositive
                      ? "bg-green-600/20 text-green-400"
                      : "bg-red-600/20 text-red-400"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isPositive
                      ? "bg-green-600/20 text-green-400"
                      : "bg-red-600/20 text-red-400"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <h3 className="text-3xl font-bold text-slate-100 mb-1">
                {stat.value}
              </h3>
              <p className="text-sm text-slate-400">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Transactions */}
      <div className="card-dark p-6">
        <h3 className="text-xl font-bold text-slate-100 mb-4">
          Transacciones Recientes
        </h3>
        <div className="space-y-3">
          {[
            {
              type: "Ingreso",
              description: "Servicio de reparación",
              amount: "+$1,250",
              date: "2024-11-20",
              positive: true,
            },
            {
              type: "Gasto",
              description: "Compra de repuestos",
              amount: "-$450",
              date: "2024-11-19",
              positive: false,
            },
            {
              type: "Ingreso",
              description: "Venta de equipo",
              amount: "+$3,200",
              date: "2024-11-18",
              positive: true,
            },
            {
              type: "Gasto",
              description: "Servicios generales",
              amount: "-$180",
              date: "2024-11-18",
              positive: false,
            },
          ].map((transaction, index) => (
            <div
              key={index}
              className="glass-dark p-4 rounded-lg border border-slate-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-2 rounded-lg ${
                    transaction.positive ? "bg-green-600/20" : "bg-red-600/20"
                  }`}
                >
                  <DollarSign
                    className={`w-5 h-5 ${
                      transaction.positive ? "text-green-400" : "text-red-400"
                    }`}
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100">
                    {transaction.description}
                  </h4>
                  <p className="text-sm text-slate-400">
                    {transaction.type} • {transaction.date}
                  </p>
                </div>
              </div>
              <span
                className={`text-lg font-bold ${
                  transaction.positive ? "text-green-400" : "text-red-400"
                }`}
              >
                {transaction.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
