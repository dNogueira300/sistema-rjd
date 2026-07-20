// src/lib/license-pdf-generator.ts
import jsPDF from "jspdf";
import { logoBase64 } from "./logo-base64";
import type { ActivationExportRow, PackageExportRow } from "@/types/license";

const primaryBlue: [number, number, number] = [37, 99, 235];
const primaryGreen: [number, number, number] = [5, 150, 105];
const darkGray: [number, number, number] = [51, 65, 85];
const mediumGray: [number, number, number] = [100, 116, 139];

function addHeader(doc: jsPDF, title: string, subtitle: string, pageWidth: number) {
  const margin = 15;
  try {
    doc.addImage(logoBase64, "PNG", margin, 10, 22, 22);
  } catch {
    // Si el logo falla, continuar sin él
  }
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryBlue);
  doc.text(title, margin + 28, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mediumGray);
  doc.text("Suministro y Servicios RJD", margin + 28, 27);
  if (subtitle) {
    doc.setTextColor(...primaryGreen);
    doc.text(subtitle, margin + 28, 33);
  }

  doc.setDrawColor(...primaryBlue);
  doc.setLineWidth(0.5);
  doc.line(margin, 38, pageWidth - margin, 38);
}

function drawTable(
  doc: jsPDF,
  startY: number,
  headers: string[],
  colWidths: number[],
  rows: string[][],
): number {
  const margin = 15;
  const rowHeight = 8;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = startY;

  const drawHeaderRow = () => {
    doc.setFillColor(...primaryBlue);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    let x = margin;
    headers.forEach((h, i) => {
      doc.rect(x, y, colWidths[i], rowHeight, "F");
      doc.text(h, x + 2, y + 5.5, { maxWidth: colWidths[i] - 3 });
      x += colWidths[i];
    });
    y += rowHeight;
  };

  drawHeaderRow();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  rows.forEach((row, idx) => {
    if (y + rowHeight > pageHeight - 15) {
      doc.addPage();
      y = 20;
      drawHeaderRow();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
    }
    if (idx % 2 === 0) {
      doc.setFillColor(241, 245, 249);
      let x = margin;
      colWidths.forEach((w) => {
        doc.rect(x, y, w, rowHeight, "F");
        x += w;
      });
    }
    doc.setTextColor(...darkGray);
    let x = margin;
    row.forEach((cell, i) => {
      const text = doc.splitTextToSize(cell || "-", colWidths[i] - 3)[0] ?? "-";
      doc.text(String(text), x + 2, y + 5.5);
      x += colWidths[i];
    });
    y += rowHeight;
  });

  return y;
}

export function generateLicenseActivationsPDF(
  rows: ActivationExportRow[],
  rangeLabel: string,
): ArrayBuffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  addHeader(doc, "REPORTE DE LICENCIAS", rangeLabel, pageWidth);

  const headers = ["Fecha", "Técnico", "Cliente", "Clave", "Soporte", "Paquete"];
  const colWidths = [22, 30, 32, 32, 40, 24];
  const body = rows.map((r) => [
    r.activationDate,
    r.technicianName,
    r.customerName,
    r.licenseKey,
    r.support,
    r.packageCode,
  ]);

  const endY = drawTable(doc, 44, headers, colWidths, body);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkGray);
  doc.text(`Total de activaciones: ${rows.length}`, 15, endY + 8);

  return doc.output("arraybuffer");
}

export function generateLicensePackagesPDF(rows: PackageExportRow[]): ArrayBuffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  addHeader(doc, "PAQUETES DE LICENCIAS", "Estado de inventario", pageWidth);

  const headers = ["Código", "Proveedor", "Total", "Usadas", "Restantes", "Estado", "Compra"];
  const colWidths = [30, 34, 16, 16, 20, 24, 26];
  const body = rows.map((r) => [
    r.code,
    r.provider,
    String(r.totalLicenses),
    String(r.usedLicenses),
    String(r.remainingLicenses),
    r.statusLabel,
    r.purchaseDate,
  ]);

  drawTable(doc, 44, headers, colWidths, body);

  return doc.output("arraybuffer");
}
