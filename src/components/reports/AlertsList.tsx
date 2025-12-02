// src/components/reports/AlertsList.tsx
"use client";

import type { Alert } from "@/types/reports";
import { AlertTriangle, AlertCircle, Info, XCircle } from "lucide-react";

interface AlertsListProps {
  alerts: Alert[];
  title?: string;
}

const SEVERITY_CONFIG = {
  CRITICAL: {
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-600/10",
    border: "border-red-600/30",
  },
  HIGH: {
    icon: AlertTriangle,
    color: "text-orange-400",
    bg: "bg-orange-600/10",
    border: "border-orange-600/30",
  },
  MEDIUM: {
    icon: AlertCircle,
    color: "text-yellow-400",
    bg: "bg-yellow-600/10",
    border: "border-yellow-600/30",
  },
  LOW: {
    icon: Info,
    color: "text-blue-400",
    bg: "bg-blue-600/10",
    border: "border-blue-600/30",
  },
};

export default function AlertsList({ alerts, title }: AlertsListProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="card-dark p-6">
        {title && (
          <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>
        )}
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
            <p className="text-slate-300">No hay alertas activas</p>
            <p className="text-sm text-slate-500 mt-1">
              Todo está funcionando correctamente
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-dark p-6">
      {title && (
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          {title}
          <span className="ml-auto text-sm font-normal text-slate-400">
            {alerts.length} {alerts.length === 1 ? "alerta" : "alertas"}
          </span>
        </h3>
      )}

      <div className="space-y-3">
        {alerts.map((alert) => {
          const config = SEVERITY_CONFIG[alert.severity];
          const Icon = config.icon;

          return (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${config.bg} ${config.border}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${config.color} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100">
                    {alert.message}
                  </p>
                  {alert.entityCode && (
                    <p className="text-xs text-slate-400 mt-1">
                      Código: {alert.entityCode}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${config.color} uppercase shrink-0`}
                >
                  {alert.severity}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
