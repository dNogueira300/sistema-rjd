// src/components/reports/LineChart.tsx
"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from "chart.js";
import type { DailyRevenue } from "@/types/reports";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LineChartProps {
  data: DailyRevenue[];
  title?: string;
}

export default function LineChart({ data }: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-slate-400">
        No hay datos disponibles
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => {
      const date = new Date(item.date);
      return date.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
      });
    }),
    datasets: [
      {
        label: "Ingresos",
        data: data.map((item) => item.income),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: "Gastos",
        data: data.map((item) => item.expenses),
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: "Ganancia",
        data: data.map((item) => item.profit),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "rgb(203, 213, 225)",
          font: { size: 12 },
          padding: 15,
          usePointStyle: true,
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
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            const value = context.parsed.y;
            if (value === null || value === undefined) {
              label += "S/ 0.00";
            } else {
              label += new Intl.NumberFormat("es-PE", {
                style: "currency",
                currency: "PEN",
              }).format(value);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "rgb(148, 163, 184)",
          font: { size: 10 },
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: "rgba(100, 116, 139, 0.1)",
        },
      },
      y: {
        ticks: {
          color: "rgb(148, 163, 184)",
          font: { size: 10 },
          callback: function (value) {
            if (value === null || value === undefined) return "S/ 0";
            return "S/ " + (value as number).toLocaleString("es-PE");
          },
        },
        grid: {
          color: "rgba(100, 116, 139, 0.1)",
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Line data={chartData} options={options} />
    </div>
  );
}
