// src/components/finance/FinanceDashboard.tsx
"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  TrendingUpDown,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useFinanceMetrics } from "@/hooks/useTransactions";

export default function FinanceDashboard() {
  const { data: metrics, isLoading } = useFinanceMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-dark p-6 rounded-xl animate-pulse">
            <div className="h-12 bg-slate-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="glass-dark p-6 rounded-xl text-center">
        <p className="text-slate-400">No se pudieron cargar las métricas</p>
      </div>
    );
  }

  const cards = [
    {
      title: "Ingresos del Día",
      value: `S/ ${metrics.todayIncome.toFixed(2)}`,
      icon: <TrendingUp className="w-6 h-6" />,
      bgColor: "bg-green-600/20",
      iconColor: "text-green-400",
      borderColor: "border-green-600/30",
    },
    {
      title: "Egresos del Día",
      value: `S/ ${metrics.todayExpenses.toFixed(2)}`,
      icon: <TrendingDown className="w-6 h-6" />,
      bgColor: "bg-red-600/20",
      iconColor: "text-red-400",
      borderColor: "border-red-600/30",
    },
    {
      title: "Balance del Día",
      value: `S/ ${metrics.balance.toFixed(2)}`,
      icon: <DollarSign className="w-6 h-6" />,
      bgColor: metrics.balance >= 0 ? "bg-blue-600/20" : "bg-red-600/20",
      iconColor: metrics.balance >= 0 ? "text-blue-400" : "text-red-400",
      borderColor:
        metrics.balance >= 0 ? "border-blue-600/30" : "border-red-600/30",
    },
    {
      title: "Rentabilidad Mensual",
      value: `${metrics.monthlyProfitability.toFixed(1)}%`,
      icon: <TrendingUpDown className="w-6 h-6" />,
      bgColor:
        metrics.monthlyProfitability >= 0
          ? "bg-purple-600/20"
          : "bg-red-600/20",
      iconColor:
        metrics.monthlyProfitability >= 0 ? "text-purple-400" : "text-red-400",
      borderColor:
        metrics.monthlyProfitability >= 0
          ? "border-purple-600/30"
          : "border-red-600/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`glass-dark p-6 rounded-xl border ${card.borderColor} ${card.bgColor}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <div className={card.iconColor}>{card.icon}</div>
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-100 mb-1">
              {card.value}
            </h3>
            <p className="text-sm text-slate-400">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Alertas y pendientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pagos pendientes */}
        <div className="glass-dark p-6 rounded-xl border border-amber-600/30 bg-amber-600/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-600/20 rounded-lg">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-amber-400">
              Pagos Pendientes
            </h3>
          </div>
          <p className="text-3xl font-bold text-amber-400 mb-1">
            {metrics.pendingPayments}
          </p>
          <p className="text-sm text-amber-400/80">
            Equipos con pago pendiente o parcial
          </p>
        </div>

        {/* Adelantos pendientes */}
        <div className="glass-dark p-6 rounded-xl border border-orange-600/30 bg-orange-600/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-600/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-orange-400">
              Adelantos Pendientes
            </h3>
          </div>
          <p className="text-3xl font-bold text-orange-400 mb-1">
            {metrics.pendingAdvances}
          </p>
          <p className="text-sm text-orange-400/80">
            Adelantos de trabajadores sin pagar
          </p>
        </div>
      </div>
    </div>
  );
}
