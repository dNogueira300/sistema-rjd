// src/components/reports/DonutChart.tsx
"use client";

import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import type { EquipmentsByStatus } from "@/types/reports";
import { EQUIPMENT_STATUS_LABELS } from "@/types/equipment";

ChartJS.register(ArcElement, Tooltip, Legend);

interface DonutChartProps {
  data: EquipmentsByStatus[];
  title?: string;
}

const STATUS_COLORS = {
  RECEIVED: "rgba(59, 130, 246, 0.8)",     // Blue
  REPAIR: "rgba(251, 191, 36, 0.8)",       // Yellow
  REPAIRED: "rgba(34, 197, 94, 0.8)",      // Green
  DELIVERED: "rgba(168, 85, 247, 0.8)",    // Purple
  CANCELLED: "rgba(239, 68, 68, 0.8)",     // Red
};

const STATUS_BORDER_COLORS = {
  RECEIVED: "rgba(59, 130, 246, 1)",
  REPAIR: "rgba(251, 191, 36, 1)",
  REPAIRED: "rgba(34, 197, 94, 1)",
  DELIVERED: "rgba(168, 85, 247, 1)",
  CANCELLED: "rgba(239, 68, 68, 1)",
};

export default function DonutChart({ data, title }: DonutChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        No hay datos disponibles
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => EQUIPMENT_STATUS_LABELS[item.status]),
    datasets: [
      {
        data: data.map((item) => item.count),
        backgroundColor: data.map((item) => STATUS_COLORS[item.status]),
        borderColor: data.map((item) => STATUS_BORDER_COLORS[item.status]),
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "rgb(203, 213, 225)",
          font: {
            size: 12,
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "rgb(203, 213, 225)",
        bodyColor: "rgb(226, 232, 240)",
        borderColor: "rgba(100, 116, 139, 0.5)",
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce(
              (acc: number, curr) => acc + (curr as number),
              0
            );
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="card-dark p-6 border-2 border-slate-700">
      {title && (
        <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>
      )}
      <div className="h-64">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}
