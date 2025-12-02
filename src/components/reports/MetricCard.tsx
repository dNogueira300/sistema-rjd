// src/components/reports/MetricCard.tsx
"use client";

import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  borderColor?: string;
  bgColor?: string;
  iconBg?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-blue-400",
  borderColor = "border-blue-500",
  bgColor = "bg-blue-600/10",
  iconBg = "bg-blue-600/20",
  trend,
  subtitle,
}: MetricCardProps) {
  return (
    <div className={`card-dark p-3 md:p-4 hover-lift border-2 ${borderColor} ${bgColor}`}>
      <div className="flex items-center gap-2 md:gap-3">
        <div className={`p-2 md:p-3 rounded-lg ${iconBg} shrink-0`}>
          <Icon className={`w-5 h-5 md:w-6 md:h-6 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg md:text-2xl font-bold text-slate-100">
            {value}
          </h3>
          <p className="text-xs md:text-sm text-slate-400 truncate">
            {title}
          </p>

          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}

          {trend && (
            <div className="flex items-center mt-1">
              <span
                className={`text-xs font-medium ${
                  trend.isPositive ? "text-green-400" : "text-red-400"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-slate-500 ml-2">vs. anterior</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
