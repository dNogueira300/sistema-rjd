// src/lib/report-pdf-generator.ts
import jsPDF from "jspdf";
import { logoBase64 } from "./logo-base64";
import { formatCurrency, formatPercentage } from "./reports";
import type {
  OperationalReportData,
  FinancialReportData,
  TechnicianPerformance,
  TechnicianExpense,
  TechnicianPaymentDetail,
} from "@/types/reports";

// ====== GENERADOR DE REPORTE OPERATIVO ======
export const generateOperationalReportPDF = (
  data: OperationalReportData
): ArrayBuffer => {
  const doc = new jsPDF();

  // Configuración de colores profesionales
  const primaryBlue: [number, number, number] = [37, 99, 235];
  const primaryGreen: [number, number, number] = [5, 150, 105];
  const darkGray: [number, number, number] = [51, 65, 85];
  const mediumGray: [number, number, number] = [100, 116, 139];
  const black: [number, number, number] = [0, 0, 0];

  // Dimensiones de página
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ====== ENCABEZADO ======
  addHeader(
    doc,
    "REPORTE OPERATIVO",
    margin,
    primaryBlue,
    mediumGray,
    primaryGreen,
    pageWidth
  );

  let currentY = 60;

  // ====== MÉTRICAS PRINCIPALES ======
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkGray);
  doc.text("Métricas Principales", margin, currentY);
  currentY += 8;

  // Grid de métricas (2x2)
  const metricBoxWidth = (pageWidth - 2 * margin - 10) / 2;
  const metricBoxHeight = 20;

  const metrics = [
    {
      label: "Total Equipos",
      value: data.metrics.totalEquipments.toString(),
      color: primaryBlue,
    },
    {
      label: "En Reparación",
      value: data.metrics.inRepair.toString(),
      color: [249, 115, 22] as [number, number, number],
    },
    {
      label: "Listos para Entrega",
      value: data.metrics.readyForDelivery.toString(),
      color: primaryGreen,
    },
    {
      label: "Entregados",
      value: data.metrics.delivered.toString(),
      color: [168, 85, 247] as [number, number, number],
    },
  ];

  metrics.forEach((metric, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + col * (metricBoxWidth + 10);
    const y = currentY + row * (metricBoxHeight + 5);

    // Box con borde
    doc.setDrawColor(...metric.color);
    doc.setLineWidth(0.5);
    doc.setFillColor(240, 249, 255);
    doc.roundedRect(x, y, metricBoxWidth, metricBoxHeight, 2, 2, "FD");

    // Label
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mediumGray);
    doc.text(metric.label, x + 5, y + 7);

    // Value
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...metric.color);
    doc.text(metric.value, x + 5, y + 16);
  });

  currentY += 50;

  // ====== TIEMPOS DE REPARACIÓN ======
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkGray);
  doc.text("Tiempos de Reparación", margin, currentY);
  currentY += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...black);

  const repairData = [
    { label: "Promedio:", value: `${data.repairTimes.averageDays} días` },
    { label: "Mediana:", value: `${data.repairTimes.medianDays} días` },
    { label: "Mínimo:", value: `${data.repairTimes.minDays} días` },
    { label: "Máximo:", value: `${data.repairTimes.maxDays} días` },
    {
      label: "Total equipos entregados:",
      value: data.repairTimes.total.toString(),
    },
  ];

  repairData.forEach((item) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...mediumGray);
    doc.text(item.label, margin, currentY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...black);
    doc.text(item.value, margin + 60, currentY);

    currentY += 6;
  });

  currentY += 5;

  // ====== TABLA DE TÉCNICOS ======
  if (currentY > pageHeight - 80) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkGray);
  doc.text("Rendimiento de Técnicos", margin, currentY);
  currentY += 8;

  // Headers de tabla
  doc.setFillColor(...primaryBlue);
  doc.rect(margin, currentY, pageWidth - 2 * margin, 8, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Técnico", margin + 2, currentY + 5);
  doc.text("Asig.", margin + 70, currentY + 5);
  doc.text("Compl.", margin + 92, currentY + 5);
  doc.text("Promedio", margin + 118, currentY + 5);
  doc.text("Facturación", pageWidth - margin - 2, currentY + 5, {
    align: "right",
  });

  currentY += 8;

  // Rows de técnicos
  doc.setFont("helvetica", "normal");
  data.technicianPerformance
    .slice(0, 10)
    .forEach((tech: TechnicianPerformance, index: number) => {
      const rowColor = index % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
      doc.setFillColor(...(rowColor as [number, number, number]));
      doc.rect(margin, currentY, pageWidth - 2 * margin, 7, "F");

      doc.setFontSize(7);
      doc.setTextColor(...black);
      doc.text(tech.technicianName, margin + 2, currentY + 5);
      doc.text(tech.assignedCount.toString(), margin + 70, currentY + 5);
      doc.text(tech.completedCount.toString(), margin + 92, currentY + 5);
      doc.text(`${tech.averageDays}d`, margin + 118, currentY + 5);
      doc.text(
        formatCurrency(tech.revenue),
        pageWidth - margin - 2,
        currentY + 5,
        { align: "right" }
      );

      currentY += 7;
    });

  // ====== FOOTER ======
  addFooter(doc, pageHeight, margin, mediumGray);

  return doc.output("arraybuffer");
};

// ====== GENERADOR DE REPORTE FINANCIERO ======
export const generateFinancialReportPDF = (
  data: FinancialReportData,
  periodLabel?: {
    income: string;
    expenses: string;
    difference: string;
  },
  dateRange?: {
    startDate?: string;
    endDate?: string;
  },
  technicianPayments?: TechnicianPaymentDetail[]
): ArrayBuffer => {
  const doc = new jsPDF();

  // Configuración de colores profesionales
  const primaryBlue: [number, number, number] = [37, 99, 235];
  const primaryGreen: [number, number, number] = [5, 150, 105];
  const darkGray: [number, number, number] = [51, 65, 85];
  const mediumGray: [number, number, number] = [100, 116, 139];
  const black: [number, number, number] = [0, 0, 0];

  // Dimensiones de página
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ====== ENCABEZADO ======
  addHeader(
    doc,
    "REPORTE FINANCIERO",
    margin,
    primaryBlue,
    mediumGray,
    primaryGreen,
    pageWidth
  );

  let currentY = 60;

  // ====== FECHAS DEL FILTRO ======
  if (dateRange && (dateRange.startDate || dateRange.endDate)) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mediumGray);

    if (dateRange.startDate && dateRange.endDate) {
      // Agregar T12:00:00 para evitar problemas de zona horaria
      const startFormatted = new Date(
        dateRange.startDate + "T12:00:00"
      ).toLocaleDateString("es-PE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const endFormatted = new Date(
        dateRange.endDate + "T12:00:00"
      ).toLocaleDateString("es-PE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.text(
        `Período: ${startFormatted} - ${endFormatted}`,
        pageWidth / 2,
        currentY,
        { align: "center" }
      );
    } else if (dateRange.startDate) {
      const startFormatted = new Date(
        dateRange.startDate + "T12:00:00"
      ).toLocaleDateString("es-PE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.text(`Desde: ${startFormatted}`, pageWidth / 2, currentY, {
        align: "center",
      });
    } else if (dateRange.endDate) {
      const endFormatted = new Date(
        dateRange.endDate + "T12:00:00"
      ).toLocaleDateString("es-PE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.text(`Hasta: ${endFormatted}`, pageWidth / 2, currentY, {
        align: "center",
      });
    }
    currentY += 10;
  }
  currentY += 5;

  // ====== KPIs PRINCIPALES ======
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkGray);
  doc.text("Indicadores Financieros", margin, currentY);
  currentY += 5;

  // Grid de KPIs (3 en primera fila, 2 en segunda fila = 5 total)
  const kpiBoxWidth = (pageWidth - 2 * margin - 16) / 3; // 3 columnas, más pequeñas
  const kpiBoxHeight = 14; // Aún más reducido
  const kpiSpacingX = 8; // Espaciado horizontal
  const kpiSpacingY = 3; // Espaciado vertical

  // Usar etiquetas dinámicas o por defecto
  const labels = periodLabel || {
    income: "Ingresos del Mes",
    expenses: "Gastos del Mes",
    difference: "Diferencia del Mes",
  };

  const kpis = [
    {
      label: "Ingresos Hoy",
      value: formatCurrency(data.kpis.todayIncome),
      color: primaryGreen,
    },
    {
      label: "Egresos Hoy",
      value: formatCurrency(data.kpis.todayExpenses),
      color: [239, 68, 68] as [number, number, number],
    },
    {
      label: labels.income,
      value: formatCurrency(data.kpis.monthIncome),
      color: primaryBlue,
    },
    {
      label: labels.expenses,
      value: formatCurrency(data.kpis.monthExpenses),
      color: [239, 68, 68] as [number, number, number],
    },
    {
      label: labels.difference,
      value: formatCurrency(data.kpis.monthProfit),
      color: data.kpis.monthProfit >= 0 ? ([168, 85, 247] as [number, number, number]) : ([239, 68, 68] as [number, number, number]),
    },
  ];

  kpis.forEach((kpi, index) => {
    // Primera fila: 3 cards (índices 0, 1, 2)
    // Segunda fila: 2 cards (índices 3, 4) centrados
    let col, row, x;

    if (index < 3) {
      // Primera fila: 3 columnas
      col = index;
      row = 0;
      x = margin + col * (kpiBoxWidth + kpiSpacingX);
    } else {
      // Segunda fila: 2 columnas centradas
      col = index - 3;
      row = 1;
      const offset =
        (pageWidth - 2 * margin - 2 * kpiBoxWidth - kpiSpacingX) / 2;
      x = margin + offset + col * (kpiBoxWidth + kpiSpacingX);
    }

    const y = currentY + row * (kpiBoxHeight + kpiSpacingY);

    // Box con borde
    doc.setDrawColor(...kpi.color);
    doc.setLineWidth(0.4);
    doc.setFillColor(240, 249, 255);
    doc.roundedRect(x, y, kpiBoxWidth, kpiBoxHeight, 1.5, 1.5, "FD");

    // Label
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mediumGray);
    doc.text(kpi.label, x + 3, y + 5);

    // Value
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...kpi.color);
    doc.text(kpi.value, x + 3, y + 11);
  });

  currentY += 2 * kpiBoxHeight + kpiSpacingY + 10; // Espacio para 2 filas + margen extra

  // ====== RESUMEN FINANCIERO ======
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkGray);
  doc.text("Resumen Mensual", margin, currentY);
  currentY += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const summaryData = [
    {
      label: "Ganancia del Mes:",
      value: formatCurrency(data.kpis.monthProfit),
      color:
        data.kpis.monthProfit >= 0
          ? primaryGreen
          : ([239, 68, 68] as [number, number, number]),
    },
    {
      label: "Pagos Pendientes:",
      value: formatCurrency(data.kpis.pendingPayments),
      color: [249, 115, 22] as [number, number, number],
    },
    {
      label: "Ingreso Total:",
      value: formatCurrency(data.kpis.totalRevenue),
      color: primaryBlue,
    },
  ];

  summaryData.forEach((item) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...mediumGray);
    doc.text(item.label, margin, currentY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...item.color);
    doc.text(item.value, margin + 60, currentY);

    currentY += 7;
  });

  currentY += 10;

  // ====== DETALLE DE PAGOS A TÉCNICOS ======
  if (technicianPayments && technicianPayments.length > 0) {
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGray);
    doc.text("Detalle de Pagos a Técnicos", margin, currentY);
    currentY += 8;

    // Headers de tabla
    doc.setFillColor(168, 85, 247); // Morado
    doc.rect(margin, currentY, pageWidth - 2 * margin, 8, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Fecha", margin + 2, currentY + 5);
    doc.text("Técnico", margin + 30, currentY + 5);
    doc.text("Tipo", margin + 85, currentY + 5);
    doc.text("Descripción", margin + 110, currentY + 5);
    doc.text("Monto", pageWidth - margin - 2, currentY + 5, { align: "right" });

    currentY += 8;

    // Rows de pagos
    doc.setFont("helvetica", "normal");
    let totalPayments = 0;

    technicianPayments.forEach(
      (payment: TechnicianPaymentDetail, index: number) => {
        if (currentY > pageHeight - 20) {
          doc.addPage();
          currentY = 20;
        }

        const rowColor = index % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
        doc.setFillColor(...(rowColor as [number, number, number]));
        doc.rect(margin, currentY, pageWidth - 2 * margin, 7, "F");

        doc.setFontSize(7);
        doc.setTextColor(...black);

        const dateFormatted = new Date(payment.date).toLocaleDateString(
          "es-PE",
          {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          }
        );
        doc.text(dateFormatted, margin + 2, currentY + 5);

        const techName =
          payment.technicianName.length > 25
            ? payment.technicianName.substring(0, 25) + "..."
            : payment.technicianName;
        doc.text(techName, margin + 30, currentY + 5);

        const typeLabel = payment.type === "ADVANCE" ? "Adelanto" : "Salario";
        doc.text(typeLabel, margin + 85, currentY + 5);

        const desc =
          payment.description.length > 20
            ? payment.description.substring(0, 20) + "..."
            : payment.description;
        doc.text(desc, margin + 110, currentY + 5);

        doc.setFont("helvetica", "bold");
        const amountColor =
          payment.type === "ADVANCE"
            ? ([249, 115, 22] as [number, number, number]) // Naranja para adelantos
            : ([59, 130, 246] as [number, number, number]); // Azul para salarios
        doc.setTextColor(...amountColor);
        doc.text(
          formatCurrency(payment.amount),
          pageWidth - margin - 2,
          currentY + 5,
          { align: "right" }
        );
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...black);

        totalPayments += payment.amount;
        currentY += 7;
      }
    );

    // Fila de total
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 7, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...black);
    doc.text("TOTAL PAGOS", margin + 2, currentY + 5);
    doc.setTextColor(168, 85, 247); // Morado
    doc.text(
      formatCurrency(totalPayments),
      pageWidth - margin - 2,
      currentY + 5,
      { align: "right" }
    );

    currentY += 15;

    // ====== TOTALES AGRUPADOS POR TÉCNICO ======
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGray);
    doc.text("Totales por Técnico", margin, currentY);
    currentY += 8;

    // Agrupar pagos por técnico
    const technicianTotals = new Map<
      string,
      {
        advances: number;
        salaries: number;
        total: number;
        advanceCount: number;
        salaryCount: number;
      }
    >();

    technicianPayments.forEach((payment) => {
      const techName = payment.technicianName;
      if (!technicianTotals.has(techName)) {
        technicianTotals.set(techName, {
          advances: 0,
          salaries: 0,
          total: 0,
          advanceCount: 0,
          salaryCount: 0,
        });
      }
      const totals = technicianTotals.get(techName)!;
      if (payment.type === "ADVANCE") {
        totals.advances += payment.amount;
        totals.advanceCount++;
      } else {
        totals.salaries += payment.amount;
        totals.salaryCount++;
      }
      totals.total += payment.amount;
    });

    // Ordenar por total descendente
    const sortedTechnicians = Array.from(technicianTotals.entries()).sort(
      (a, b) => b[1].total - a[1].total
    );

    // Headers de tabla
    doc.setFillColor(59, 130, 246); // Azul
    doc.rect(margin, currentY, pageWidth - 2 * margin, 8, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Técnico", margin + 2, currentY + 5);
    doc.text("Adelantos", margin + 70, currentY + 5);
    doc.text("Salarios", margin + 110, currentY + 5);
    doc.text("Total", pageWidth - margin - 2, currentY + 5, { align: "right" });

    currentY += 8;

    // Rows de totales por técnico
    doc.setFont("helvetica", "normal");
    let grandTotalAdvances = 0;
    let grandTotalSalaries = 0;
    let grandTotal = 0;

    sortedTechnicians.forEach(([techName, totals], index) => {
      if (currentY > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }

      const rowColor = index % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
      doc.setFillColor(...(rowColor as [number, number, number]));
      doc.rect(margin, currentY, pageWidth - 2 * margin, 7, "F");

      doc.setFontSize(8);
      doc.setTextColor(...black);

      // Nombre del técnico
      const displayName =
        techName.length > 30 ? techName.substring(0, 30) + "..." : techName;
      doc.text(displayName, margin + 2, currentY + 5);

      // Adelantos
      doc.setTextColor(249, 115, 22); // Naranja
      const advanceText =
        totals.advanceCount > 0
          ? `${formatCurrency(totals.advances)} (${totals.advanceCount})`
          : "-";
      doc.text(advanceText, margin + 70, currentY + 5);

      // Salarios
      doc.setTextColor(59, 130, 246); // Azul
      const salaryText =
        totals.salaryCount > 0
          ? `${formatCurrency(totals.salaries)} (${totals.salaryCount})`
          : "-";
      doc.text(salaryText, margin + 110, currentY + 5);

      // Total
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...black);
      doc.text(
        formatCurrency(totals.total),
        pageWidth - margin - 2,
        currentY + 5,
        { align: "right" }
      );
      doc.setFont("helvetica", "normal");

      grandTotalAdvances += totals.advances;
      grandTotalSalaries += totals.salaries;
      grandTotal += totals.total;

      currentY += 7;
    });

    // Fila de gran total
    doc.setFillColor(200, 200, 200);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 8, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...black);
    doc.text("TOTAL GENERAL", margin + 2, currentY + 5);

    doc.setTextColor(249, 115, 22);
    doc.text(formatCurrency(grandTotalAdvances), margin + 70, currentY + 5);

    doc.setTextColor(59, 130, 246);
    doc.text(formatCurrency(grandTotalSalaries), margin + 110, currentY + 5);

    doc.setTextColor(...primaryBlue);
    doc.text(formatCurrency(grandTotal), pageWidth - margin - 2, currentY + 5, {
      align: "right",
    });

    currentY += 15;
  }

  // ====== TOTALES DE PAGOS POR TÉCNICO (Adelantos y Salarios) ======
  if (data.technicianExpenses && data.technicianExpenses.length > 0) {
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGray);
    doc.text("Totales de Pagos por Técnico", margin, currentY);
    currentY += 8;

    // Headers de tabla
    doc.setFillColor(239, 68, 68); // Rojo para egresos
    doc.rect(margin, currentY, pageWidth - 2 * margin, 8, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Técnico", margin + 2, currentY + 5);
    doc.text("Adelantos", margin + 70, currentY + 5);
    doc.text("N° Adel.", margin + 105, currentY + 5);
    doc.text("Salarios", margin + 130, currentY + 5);
    doc.text("N° Sal.", margin + 160, currentY + 5);
    doc.text("Total", pageWidth - margin - 2, currentY + 5, { align: "right" });

    currentY += 8;

    // Rows de egresos
    doc.setFont("helvetica", "normal");
    data.technicianExpenses.forEach(
      (tech: TechnicianExpense, index: number) => {
        if (currentY > pageHeight - 20) {
          doc.addPage();
          currentY = 20;
        }

        const rowColor = index % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
        doc.setFillColor(...(rowColor as [number, number, number]));
        doc.rect(margin, currentY, pageWidth - 2 * margin, 7, "F");

        doc.setFontSize(7);
        doc.setTextColor(...black);
        doc.text(tech.technicianName, margin + 2, currentY + 5);
        doc.text(formatCurrency(tech.totalAdvances), margin + 70, currentY + 5);
        doc.text(tech.advanceCount.toString(), margin + 105, currentY + 5);
        doc.text(
          formatCurrency(tech.totalSalaries),
          margin + 130,
          currentY + 5
        );
        doc.text(tech.salaryCount.toString(), margin + 160, currentY + 5);
        doc.text(
          formatCurrency(tech.totalExpenses),
          pageWidth - margin - 2,
          currentY + 5,
          { align: "right" }
        );

        currentY += 7;
      }
    );

    // Fila de totales
    const totalAdvances = data.technicianExpenses.reduce(
      (sum, t) => sum + t.totalAdvances,
      0
    );
    const totalSalaries = data.technicianExpenses.reduce(
      (sum, t) => sum + t.totalSalaries,
      0
    );
    const totalExpenses = data.technicianExpenses.reduce(
      (sum, t) => sum + t.totalExpenses,
      0
    );
    const totalAdvanceCount = data.technicianExpenses.reduce(
      (sum, t) => sum + t.advanceCount,
      0
    );
    const totalSalaryCount = data.technicianExpenses.reduce(
      (sum, t) => sum + t.salaryCount,
      0
    );

    doc.setFillColor(220, 220, 220);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 7, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...black);
    doc.text("TOTAL", margin + 2, currentY + 5);
    doc.text(formatCurrency(totalAdvances), margin + 70, currentY + 5);
    doc.text(totalAdvanceCount.toString(), margin + 105, currentY + 5);
    doc.text(formatCurrency(totalSalaries), margin + 130, currentY + 5);
    doc.text(totalSalaryCount.toString(), margin + 160, currentY + 5);
    doc.text(
      formatCurrency(totalExpenses),
      pageWidth - margin - 2,
      currentY + 5,
      { align: "right" }
    );

    currentY += 15;

    // ====== GRÁFICO DE BARRAS POR TÉCNICO ======
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGray);
    doc.text("Total de Pagos por Técnico", margin, currentY);
    currentY += 10;

    // Ordenar técnicos por total descendente
    const sortedTechnicians = [...data.technicianExpenses].sort(
      (a, b) => b.totalExpenses - a.totalExpenses
    );
    const maxExpense =
      sortedTechnicians.length > 0 ? sortedTechnicians[0].totalExpenses : 0;
    const maxBarWidth = pageWidth - 2 * margin - 60; // Espacio para nombre y valor
    const barHeight = 8;
    const barSpacing = 4;

    sortedTechnicians.forEach((tech) => {
      if (currentY > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }

      // Nombre del técnico
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...black);
      const techName =
        tech.technicianName.length > 20
          ? tech.technicianName.substring(0, 20) + "..."
          : tech.technicianName;
      doc.text(techName, margin, currentY + 6);

      // Calcular ancho de la barra
      const barWidth =
        maxExpense > 0 ? (tech.totalExpenses / maxExpense) * maxBarWidth : 0;

      // Dibujar barra
      doc.setFillColor(59, 130, 246); // Azul
      doc.roundedRect(margin + 50, currentY, barWidth, barHeight, 2, 2, "F");

      // Valor al final de la barra
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...primaryBlue);
      doc.text(
        formatCurrency(tech.totalExpenses),
        margin + 50 + barWidth + 3,
        currentY + 6
      );

      // Porcentaje (opcional)
      const percentage =
        maxExpense > 0
          ? ((tech.totalExpenses / maxExpense) * 100).toFixed(0)
          : "0";
      if (barWidth > 20) {
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text(percentage + "%", margin + 50 + barWidth - 12, currentY + 6);
      }

      currentY += barHeight + barSpacing;
    });
  }

  // ====== FOOTER ======
  addFooter(doc, pageHeight, margin, mediumGray);

  return doc.output("arraybuffer");
};

// ====== GENERADOR DE REPORTE POR TÉCNICO ======
export const generateTechnicianReportPDF = (
  technicianName: string,
  technicianPayments: TechnicianPaymentDetail[],
  dateRange?: { startDate?: string; endDate?: string }
): ArrayBuffer => {
  const doc = new jsPDF();

  const primaryBlue: [number, number, number] = [37, 99, 235];
  const primaryGreen: [number, number, number] = [5, 150, 105];
  const darkGray: [number, number, number] = [51, 65, 85];
  const mediumGray: [number, number, number] = [100, 116, 139];
  const black: [number, number, number] = [0, 0, 0];

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ====== ENCABEZADO ======
  addHeader(
    doc,
    "REPORTE DE TÉCNICO",
    margin,
    primaryBlue,
    mediumGray,
    primaryGreen,
    pageWidth
  );

  let currentY = 60;

  // ====== NOMBRE DEL TÉCNICO ======
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkGray);
  doc.text(`Técnico: ${technicianName}`, pageWidth / 2, currentY, { align: "center" });
  currentY += 8;

  // ====== PERÍODO ======
  if (dateRange && (dateRange.startDate || dateRange.endDate)) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mediumGray);

    if (dateRange.startDate && dateRange.endDate) {
      const startFormatted = new Date(dateRange.startDate + "T12:00:00").toLocaleDateString("es-PE", {
        year: "numeric", month: "long", day: "numeric",
      });
      const endFormatted = new Date(dateRange.endDate + "T12:00:00").toLocaleDateString("es-PE", {
        year: "numeric", month: "long", day: "numeric",
      });
      doc.text(`Período: ${startFormatted} - ${endFormatted}`, pageWidth / 2, currentY, { align: "center" });
    } else if (dateRange.startDate) {
      const startFormatted = new Date(dateRange.startDate + "T12:00:00").toLocaleDateString("es-PE", {
        year: "numeric", month: "long", day: "numeric",
      });
      doc.text(`Desde: ${startFormatted}`, pageWidth / 2, currentY, { align: "center" });
    } else if (dateRange.endDate) {
      const endFormatted = new Date(dateRange.endDate + "T12:00:00").toLocaleDateString("es-PE", {
        year: "numeric", month: "long", day: "numeric",
      });
      doc.text(`Hasta: ${endFormatted}`, pageWidth / 2, currentY, { align: "center" });
    }
    currentY += 8;
  }

  currentY += 5;

  // ====== TABLA DE REGISTROS ======
  if (technicianPayments.length === 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mediumGray);
    doc.text("No se encontraron registros para este técnico en el período seleccionado.", margin, currentY);
  } else {
    // Headers de tabla
    doc.setFillColor(168, 85, 247); // Morado
    doc.rect(margin, currentY, pageWidth - 2 * margin, 8, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Fecha", margin + 2, currentY + 5);
    doc.text("Tipo", margin + 35, currentY + 5);
    doc.text("Descripción", margin + 65, currentY + 5);
    doc.text("Método de Pago", margin + 115, currentY + 5);
    doc.text("Monto", pageWidth - margin - 2, currentY + 5, { align: "right" });

    currentY += 8;

    // Rows
    doc.setFont("helvetica", "normal");
    let totalAmount = 0;

    technicianPayments.forEach((payment: TechnicianPaymentDetail, index: number) => {
      if (currentY > pageHeight - 25) {
        doc.addPage();
        currentY = 20;
      }

      const rowColor = index % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
      doc.setFillColor(...(rowColor as [number, number, number]));
      doc.rect(margin, currentY, pageWidth - 2 * margin, 7, "F");

      doc.setFontSize(7);
      doc.setTextColor(...black);

      const dateFormatted = new Date(payment.date).toLocaleDateString("es-PE", {
        day: "2-digit", month: "2-digit", year: "2-digit",
      });
      doc.text(dateFormatted, margin + 2, currentY + 5);

      const typeLabel = payment.type === "ADVANCE" ? "Adelanto" : "Salario";
      doc.text(typeLabel, margin + 35, currentY + 5);

      const desc = payment.description.length > 25
        ? payment.description.substring(0, 25) + "..."
        : payment.description;
      doc.text(desc, margin + 65, currentY + 5);

      const methodLabel = payment.paymentMethod === "CASH" ? "Efectivo"
        : payment.paymentMethod === "YAPE" ? "Yape"
        : payment.paymentMethod === "PLIN" ? "Plin"
        : "Transferencia";
      doc.text(methodLabel, margin + 115, currentY + 5);

      doc.setFont("helvetica", "bold");
      const amountColor = payment.type === "ADVANCE"
        ? ([249, 115, 22] as [number, number, number])
        : ([59, 130, 246] as [number, number, number]);
      doc.setTextColor(...amountColor);
      doc.text(formatCurrency(payment.amount), pageWidth - margin - 2, currentY + 5, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...black);

      totalAmount += payment.amount;
      currentY += 7;
    });

    // Fila de total
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 8, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...black);
    doc.text("TOTAL", margin + 2, currentY + 5.5);
    doc.setTextColor(168, 85, 247);
    doc.text(formatCurrency(totalAmount), pageWidth - margin - 2, currentY + 5.5, { align: "right" });
  }

  // ====== FOOTER ======
  addFooter(doc, pageHeight, margin, mediumGray);

  return doc.output("arraybuffer");
};

// ====== FUNCIONES AUXILIARES ======
function addHeader(
  doc: jsPDF,
  title: string,
  margin: number,
  primaryBlue: [number, number, number],
  mediumGray: [number, number, number],
  primaryGreen: [number, number, number],
  pageWidth: number
) {
  try {
    const logoHeight = 20;
    const logoWidth = 32.6;
    const logoX = margin;
    const logoY = 12;

    doc.addImage(logoBase64, "PNG", logoX, logoY, logoWidth, logoHeight);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryBlue);
    doc.text("SUMINISTRO Y SERVICIOS RJD", logoX + logoWidth + 5, logoY + 8);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mediumGray);
    doc.text(
      "Servicio Técnico Especializado",
      logoX + logoWidth + 5,
      logoY + 14
    );
  } catch (error) {
    console.error("Error al cargar logo:", error);
    doc.setFontSize(18);
    doc.setTextColor(...primaryBlue);
    doc.text("SUMINISTRO Y SERVICIOS RJD", margin, 20);
  }

  // Línea separadora decorativa
  doc.setDrawColor(...primaryGreen);
  doc.setLineWidth(1.5);
  doc.line(margin, 38, pageWidth - margin, 38);

  // Título del documento
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);
  doc.text(title, pageWidth / 2, 50, { align: "center" });
}

function addFooter(
  doc: jsPDF,
  pageHeight: number,
  margin: number,
  mediumGray: [number, number, number]
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  let footerY = pageHeight - 18;

  // Línea principal - Empresa
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mediumGray);
  doc.text(
    "SUMINISTRO Y SERVICIOS RJD - Servicio Técnico Especializado",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  // Línea inferior - Generado (más pequeña y cursiva)
  footerY += 4;
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(120, 120, 120); // Gris más claro

  const currentDate = new Date().toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.text(`Generado: ${currentDate}`, pageWidth / 2, footerY, {
    align: "center",
  });
}
