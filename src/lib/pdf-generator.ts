// src/lib/pdf-generator.ts
import jsPDF from "jspdf";
import { logoBase64 } from "./logo-base64";
import { formatDate, formatCurrency } from "./utils";
import type {
  Equipment,
  PaymentMethod,
  VoucherType,
  PaymentStatus,
} from "@/types/equipment";
import {
  EQUIPMENT_TYPE_LABELS,
  EQUIPMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/types/equipment";

interface PaymentInfo {
  id: string;
  totalAmount: number;
  advanceAmount: number;
  remainingAmount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  voucherType: VoucherType;
  paymentStatus: PaymentStatus;
}

interface ComprobanteData {
  equipment: Equipment & {
    customer: {
      name: string;
      phone: string;
    };
    payments?: PaymentInfo[];
  };
}

export const generateComprobanteIngreso = (
  data: ComprobanteData
): ArrayBuffer => {
  const { equipment } = data;
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

  // ====== ENCABEZADO HORIZONTAL CON LOGO ======
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
      "Servicio Tecnico Especializado",
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

  // Título del documento - CAMBIADO A COMPROBANTE DE SERVICIO
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkGray);
  doc.text("COMPROBANTE DE SERVICIO", pageWidth / 2, 50, { align: "center" });

  // Código de equipo destacado con fondo
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(margin, 56, pageWidth - 2 * margin, 12, 2, 2, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mediumGray);
  doc.text("Codigo de Equipo:", margin + 5, 63);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...primaryBlue);
  doc.text(equipment.code, margin + 50, 63);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...mediumGray);
  doc.text(
    `Fecha de Ingreso: ${formatDate(equipment.entryDate)}`,
    pageWidth - margin - 5,
    63,
    { align: "right" }
  );

  let yPos = 75;

  // ====== SECCIÓN: DATOS DEL CLIENTE ======
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 28, 3, 3, "F");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkGray);
  doc.text("DATOS DEL CLIENTE", margin + 5, yPos + 7);

  yPos += 14;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...mediumGray);
  doc.text("Cliente:", margin + 5, yPos);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...black);
  doc.text(equipment.customer.name, margin + 25, yPos);

  yPos += 7;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...mediumGray);
  doc.text("Telefono:", margin + 5, yPos);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...black);
  doc.text(`+51 ${equipment.customer.phone}`, margin + 25, yPos);

  yPos += 12;

  // ====== SECCIÓN: INFORMACIÓN DEL EQUIPO (CON CONTENEDOR) ======
  const equipmentSectionStartY = yPos;

  // Pre-calcular líneas para estimar altura
  const flawLinesCol = doc.splitTextToSize(
    equipment.reportedFlaw,
    pageWidth / 2 - margin - 10
  );
  let serviceLinesCol: string[] = [];
  if (equipment.serviceType) {
    serviceLinesCol = doc.splitTextToSize(
      equipment.serviceType,
      pageWidth / 2 - margin - 10
    );
  }

  // Calcular altura estimada del contenedor
  let estimatedHeight = 14; // título
  estimatedHeight += 11; // 2 filas de datos básicos (6 + 5)
  estimatedHeight += Math.max(
    flawLinesCol.length * 5 + 3,
    serviceLinesCol.length * 5 + 3
  ); // fila 3
  // Fila 4: estado actual | accesorios (sin espacio extra)
  const accessoriesShortLines = equipment.accessories
    ? doc.splitTextToSize(equipment.accessories, pageWidth / 2 - margin - 10)
    : [];
  estimatedHeight += Math.max(6, accessoriesShortLines.length * 6);
  // Fila 5: Otros (información adicional)
  const othersLines = equipment.others
    ? doc.splitTextToSize(equipment.others, pageWidth - 2 * margin - 15)
    : [];
  if (othersLines.length > 0) {
    estimatedHeight += othersLines.length * 5 + 6;
  }
  estimatedHeight += 5; // padding final

  // Dibujar contenedor PRIMERO
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(
    margin,
    equipmentSectionStartY,
    pageWidth - 2 * margin,
    estimatedHeight,
    3,
    3,
    "F"
  );

  // Título
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkGray);
  doc.text("INFORMACION DEL EQUIPO", margin + 5, yPos + 7);

  yPos += 14;

  doc.setFontSize(9);

  // Grid de 2 columnas para datos básicos
  const col1X = margin + 5;
  const col2X = pageWidth / 2 + 5;
  let currentY = yPos;

  // FILA 1: Tipo de Equipo | N de Serie
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...mediumGray);
  doc.text("Tipo de Equipo:", col1X, currentY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...black);
  doc.text(EQUIPMENT_TYPE_LABELS[equipment.type], col1X + 30, currentY);

  if (equipment.serialNumber) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...mediumGray);
    doc.text("N de Serie:", col2X, currentY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...black);
    doc.text(equipment.serialNumber, col2X + 25, currentY);
  }
  currentY += 6;

  // FILA 2: Marca | Modelo
  if (equipment.brand) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...mediumGray);
    doc.text("Marca:", col1X, currentY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...black);
    doc.text(equipment.brand, col1X + 30, currentY);
  }

  if (equipment.model) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...mediumGray);
    doc.text("Modelo:", col2X, currentY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...black);
    doc.text(equipment.model, col2X + 25, currentY);
  }
  currentY += 5;

  // FILA 3: Falla Reportada | Tipo de Servicio (multilinea)
  // Columna izquierda: Falla Reportada
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...mediumGray);
  doc.text("Falla Reportada:", col1X, currentY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...black);
  doc.text(flawLinesCol, col1X, currentY + 3);
  const flawEndY = currentY + 3 + flawLinesCol.length * 5;

  // Columna derecha: Tipo de Servicio
  let serviceEndY = currentY;
  if (equipment.serviceType) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...mediumGray);
    doc.text("Tipo de Servicio:", col2X, currentY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...black);
    doc.text(serviceLinesCol, col2X, currentY + 3);
    serviceEndY = currentY + 3 + serviceLinesCol.length * 5;
  }

  currentY = Math.max(flawEndY, serviceEndY);

  // FILA 4: Estado Actual | Accesorios
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...mediumGray);
  doc.text("Estado Actual:", col1X, currentY);

  // Resaltar estado actual con color de fondo según el estado
  const statusText = EQUIPMENT_STATUS_LABELS[equipment.status];
  const statusX = col1X + 30;
  const statusY = currentY;

  // Colores según estado (igual que en la tabla de equipos)
  // Fondo con 20% de opacidad simulado mezclando con blanco
  let statusBgColor: [number, number, number];
  let statusTextColor: [number, number, number];

  switch (equipment.status) {
    case "RECEIVED":
      statusBgColor = [213, 224, 246];
      statusTextColor = [4, 86, 199];
      break;
    case "REPAIR":
      statusBgColor = [250, 242, 204];
      statusTextColor = [161, 144, 8];
      break;
    case "REPAIRED":
      statusBgColor = [205, 240, 229];
      statusTextColor = [6, 125, 38];
      break;
    case "DELIVERED":
      statusBgColor = [234, 214, 250];
      statusTextColor = [108, 14, 194];
      break;
    case "CANCELLED":
      statusBgColor = [248, 215, 215];
      statusTextColor = [189, 4, 4];
      break;
    default:
      statusBgColor = [234, 214, 250];
      statusTextColor = [192, 132, 252];
  }

  // Dibujar rectángulo de fondo
  const statusTextWidth = doc.getTextWidth(statusText);
  const padding = 3;
  doc.setFillColor(...statusBgColor);
  doc.roundedRect(
    statusX - padding,
    statusY - 4,
    statusTextWidth + padding * 2,
    6,
    1,
    1,
    "F"
  );

  // Texto del estado con color
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...statusTextColor);
  doc.text(statusText, statusX, statusY);

  // Accesorios a la derecha de Estado Actual
  if (equipment.accessories) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...mediumGray);
    doc.text("Accesorios:", col2X, currentY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...black);
    const accessoriesShort = doc.splitTextToSize(
      equipment.accessories,
      pageWidth / 2 - margin - 10
    );
    doc.text(accessoriesShort, col2X + 25, currentY);
    currentY += Math.max(6, accessoriesShort.length * 6);
  } else {
    currentY += 6;
  }

  // FILA 5: Información Adicional (Otros) - ancho completo
  if (equipment.others) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...mediumGray);
    doc.text("Informacion Adicional:", col1X, currentY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...black);
    const othersFullWidth = doc.splitTextToSize(
      equipment.others,
      pageWidth - 2 * margin - 15
    );
    doc.text(othersFullWidth, col1X, currentY + 3);
    currentY += othersFullWidth.length * 5 + 6;
  }

  yPos = equipmentSectionStartY + estimatedHeight + 8; // Espacio después del contenedor

  // ====== INFORMACIÓN DE PAGOS (CON CONTENEDOR) ======
  if (equipment.payments && equipment.payments.length > 0) {
    const payment = equipment.payments[0];

    const paymentSectionStartY = yPos;

    // Calcular altura del contenedor de pago
    const paymentHeight = payment.advanceAmount > 0 ? 40 : 32;

    // Dibujar contenedor
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(
      margin,
      paymentSectionStartY,
      pageWidth - 2 * margin,
      paymentHeight,
      3,
      3,
      "F"
    );

    // Título
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGray);
    doc.text("INFORMACION DE PAGO", margin + 5, yPos + 7);

    yPos += 14;

    doc.setFontSize(10);

    // Monto total
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...mediumGray);
    doc.text("Monto Total:", margin + 5, yPos);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...black);
    doc.text(formatCurrency(payment.totalAmount), margin + 40, yPos);

    yPos += 7;

    // Adelanto si existe
    if (payment.advanceAmount > 0) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...mediumGray);
      doc.text("Monto Pagado:", margin + 5, yPos);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...primaryGreen);
      doc.text(formatCurrency(payment.advanceAmount), margin + 40, yPos);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...mediumGray);
      doc.text(
        `(${PAYMENT_METHOD_LABELS[payment.paymentMethod]})`,
        margin + 70,
        yPos
      );

      yPos += 7;

      // Saldo pendiente
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...mediumGray);
      doc.text("Saldo Pendiente:", margin + 5, yPos);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...primaryBlue);
      doc.text(formatCurrency(payment.remainingAmount), margin + 40, yPos);

      yPos += 10;
    } else {
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...mediumGray);
      doc.text("No se ha realizado adelanto", margin + 5, yPos);
      yPos += 10;
    }
  }

  // ====== PIE DE PÁGINA CON TÉRMINOS PEGADOS ======
  const footerY = pageHeight - 36; // Footer más arriba (movido ligeramente hacia arriba)

  // Preparar texto de términos y condiciones
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...mediumGray);
  const terminos =
    "El cliente se compromete a recoger el equipo en un plazo maximo de 30 dias despues de notificada su reparacion. Pasado este tiempo, Suministro y Servicios RJD no se hace responsable por el equipo.";
  const terminosLines = doc.splitTextToSize(
    terminos,
    pageWidth - 2 * margin - 10
  );

  // Mantener la posición de la línea separadora (contactY) como estaba,
  // pero colocar los términos más cerca de esa línea sin moverla.
  const contactY = footerY + 7 + terminosLines.length * 3.5 + 9; // conservar para la línea

  // Calcular Y para los términos para que queden justo encima de la línea
  const terminosY = contactY - terminosLines.length * 3.5 - 2;
  const titleY = terminosY - 3;

  // TÍTULO: TÉRMINOS Y CONDICIONES (ubicado cerca de los términos)
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkGray);
  doc.text("TERMINOS Y CONDICIONES:", pageWidth / 2, titleY, {
    align: "center",
  });

  // CUERPO: términos (ubicados más abajo, cercanos a la línea azul)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...mediumGray);
  doc.text(terminosLines, pageWidth / 2, terminosY, { align: "center" });

  // Línea separadora
  doc.setDrawColor(...primaryBlue);
  doc.setLineWidth(1);
  doc.line(margin, contactY - 4, pageWidth - margin, contactY - 4);

  doc.setFontSize(9);

  // Calcular ancho aproximado del texto para centrarlo manualmente
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkGray);

  const phoneLabel = "Telefono:";
  const phoneValue = " +51 979 728 688";
  const separator = "  |  ";
  const addressLabel = "Direccion:";
  const addressValue = " Calle Pachacutec 129, Iquitos - Peru";

  // Calcular posiciones para centrar
  const phoneWidth = doc.getTextWidth(phoneLabel + phoneValue);
  const separatorWidth = doc.getTextWidth(separator);
  const addressWidth = doc.getTextWidth(addressLabel + addressValue);
  const totalWidth = phoneWidth + separatorWidth + addressWidth;

  let xPos = (pageWidth - totalWidth) / 2;

  // Teléfono en negrita
  doc.text(phoneLabel, xPos, contactY);
  xPos += doc.getTextWidth(phoneLabel);
  doc.text(phoneValue, xPos, contactY);
  xPos += doc.getTextWidth(phoneValue);

  // Separador
  doc.text(separator, xPos, contactY);
  xPos += separatorWidth;

  // Dirección en negrita
  doc.text(addressLabel, xPos, contactY);
  xPos += doc.getTextWidth(addressLabel);
  doc.text(addressValue, xPos, contactY);

  // Marca de agua
  doc.setFontSize(6);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...mediumGray);
  doc.text(
    `Documento generado el ${formatDate(
      new Date()
    )} - Suministro y Servicios RJD`,
    pageWidth / 2,
    pageHeight - 6,
    { align: "center" }
  );

  return doc.output("arraybuffer");
};
