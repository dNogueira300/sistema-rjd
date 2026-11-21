// src/app/dashboard/licencias/page.tsx
"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  FileDown,
  FileSpreadsheet,
  KeyRound,
  Package,
  ShieldCheck,
  CalendarCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useLicensePackages } from "@/hooks/useLicensePackages";
import { useLicenseActivations } from "@/hooks/useLicenseActivations";
import { useTechnicians } from "@/hooks/useTechnicians";
import LicensePackageForm from "@/components/licenses/LicensePackageForm";
import LicensePackagesTable from "@/components/licenses/LicensePackagesTable";
import LicenseActivationForm from "@/components/licenses/LicenseActivationForm";
import LicenseActivationsTable from "@/components/licenses/LicenseActivationsTable";
import LicenseFilters from "@/components/licenses/LicenseFilters";
import ConfirmModal from "@/components/clients/ConfirmModal";
import MetricCard from "@/components/reports/MetricCard";
import { formatDate } from "@/lib/utils";
import type {
  LicensePackage,
  LicenseActivation,
  LicenseActivationFilters,
  PackageStockStatus,
} from "@/types/license";

type Tab = "activations" | "packages";

const statusLabel: Record<PackageStockStatus, string> = {
  ACTIVE: "Activo",
  LOW: "Stock bajo",
  DEPLETED: "Agotado",
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LicenciasPage() {
  const [tab, setTab] = useState<Tab>("activations");
  const [filters, setFilters] = useState<LicenseActivationFilters>({});

  const { packages, isLoading: loadingPackages, createPackage, updatePackage, deletePackage, isMutating: mutatingPackages } = useLicensePackages();
  const { activations, isLoading: loadingActivations, createActivation, updateActivation, deleteActivation, isMutating: mutatingActivations } = useLicenseActivations(filters);
  const { technicians } = useTechnicians();

  const technicianOptions = useMemo(() => (technicians ?? []).map((t) => ({ id: t.id, name: t.name })), [technicians]);

  // Modales de formulario
  const [packageFormOpen, setPackageFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<LicensePackage | null>(null);
  const [activationFormOpen, setActivationFormOpen] = useState(false);
  const [editingActivation, setEditingActivation] = useState<LicenseActivation | null>(null);

  // Confirmaciones de borrado
  const [packageToDelete, setPackageToDelete] = useState<LicensePackage | null>(null);
  const [activationToDelete, setActivationToDelete] = useState<LicenseActivation | null>(null);

  // Estadísticas globales de stock (independientes de los filtros)
  const stats = useMemo(() => {
    const total = packages.reduce((sum, p) => sum + p.totalLicenses, 0);
    const used = packages.reduce((sum, p) => sum + p.usedLicenses, 0);
    const remaining = packages.reduce((sum, p) => sum + p.remainingLicenses, 0);
    const lowStock = packages.filter((p) => p.stockStatus === "LOW").length;
    const depleted = packages.filter((p) => p.stockStatus === "DEPLETED").length;
    return {
      total,
      used,
      remaining,
      lowStock,
      depleted,
      usedPct: total > 0 ? Math.round((used / total) * 100) : 0,
    };
  }, [packages]);

  const rangeLabel = useMemo(() => {
    const from = filters.from ? formatDate(filters.from) : null;
    const to = filters.to ? formatDate(filters.to) : null;
    if (from && to) return `Del ${from} al ${to}`;
    if (from) return `Desde ${from}`;
    if (to) return `Hasta ${to}`;
    return "Todas las activaciones";
  }, [filters]);

  // ====== EXPORTACIÓN ACTIVACIONES ======
  const exportActivationsExcel = async () => {
    if (activations.length === 0) return toast.error("No hay activaciones para exportar");
    const wb = new (await import("exceljs")).default.Workbook();
    const ws = wb.addWorksheet("Activaciones");
    ws.columns = [
      { header: "Fecha", key: "fecha", width: 14 },
      { header: "Técnico", key: "tecnico", width: 24 },
      { header: "Cliente", key: "cliente", width: 24 },
      { header: "Clave", key: "clave", width: 28 },
      { header: "Soporte", key: "soporte", width: 34 },
      { header: "Paquete", key: "paquete", width: 18 },
      { header: "Observaciones", key: "obs", width: 30 },
    ];
    activations.forEach((a) =>
      ws.addRow({
        fecha: formatDate(a.activationDate),
        tecnico: a.technician.name,
        cliente: a.customer.name,
        clave: a.licenseKey,
        soporte: a.support,
        paquete: a.package.code,
        obs: a.observations ?? "",
      })
    );
    ws.getRow(1).font = { bold: true };
    const buffer = await wb.xlsx.writeBuffer();
    downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "activaciones-licencias.xlsx");
  };

  const exportActivationsPDF = async () => {
    if (activations.length === 0) return toast.error("No hay activaciones para exportar");
    const rows = activations.map((a) => ({
      activationDate: formatDate(a.activationDate),
      technicianName: a.technician.name,
      customerName: a.customer.name,
      licenseKey: a.licenseKey,
      support: a.support,
      packageCode: a.package.code,
      observations: a.observations ?? "",
    }));
    const { generateLicenseActivationsPDF } = await import("@/lib/license-pdf-generator");
    const buffer = generateLicenseActivationsPDF(rows, rangeLabel);
    downloadBlob(new Blob([buffer], { type: "application/pdf" }), "activaciones-licencias.pdf");
  };

  // ====== EXPORTACIÓN PAQUETES ======
  const exportPackagesExcel = async () => {
    if (packages.length === 0) return toast.error("No hay paquetes para exportar");
    const wb = new (await import("exceljs")).default.Workbook();
    const ws = wb.addWorksheet("Paquetes");
    ws.columns = [
      { header: "Código", key: "codigo", width: 20 },
      { header: "Proveedor", key: "proveedor", width: 24 },
      { header: "Total", key: "total", width: 10 },
      { header: "Usadas", key: "usadas", width: 10 },
      { header: "Restantes", key: "restantes", width: 12 },
      { header: "Estado", key: "estado", width: 14 },
      { header: "Compra", key: "compra", width: 14 },
    ];
    packages.forEach((p) =>
      ws.addRow({
        codigo: p.code,
        proveedor: p.provider ?? "",
        total: p.totalLicenses,
        usadas: p.usedLicenses,
        restantes: p.remainingLicenses,
        estado: statusLabel[p.stockStatus],
        compra: formatDate(p.purchaseDate),
      })
    );
    ws.getRow(1).font = { bold: true };
    const buffer = await wb.xlsx.writeBuffer();
    downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "paquetes-licencias.xlsx");
  };

  const exportPackagesPDF = async () => {
    if (packages.length === 0) return toast.error("No hay paquetes para exportar");
    const rows = packages.map((p) => ({
      code: p.code,
      provider: p.provider ?? "-",
      totalLicenses: p.totalLicenses,
      usedLicenses: p.usedLicenses,
      remainingLicenses: p.remainingLicenses,
      statusLabel: statusLabel[p.stockStatus],
      purchaseDate: formatDate(p.purchaseDate),
    }));
    const { generateLicensePackagesPDF } = await import("@/lib/license-pdf-generator");
    const buffer = generateLicensePackagesPDF(rows);
    downloadBlob(new Blob([buffer], { type: "application/pdf" }), "paquetes-licencias.pdf");
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Encabezado */}
      <div className="card-dark p-4 md:p-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 md:p-3 rounded-lg bg-linear-to-br from-indigo-600 to-indigo-700 shrink-0">
            <KeyRound className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-slate-100 truncate">
              Licencias de Antivirus
            </h2>
            <p className="text-sm md:text-base text-slate-400 hidden sm:block">
              Paquetes comprados y activaciones por cliente
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title="Licencias compradas"
          value={loadingPackages ? "—" : stats.total}
          icon={Package}
          iconColor="text-blue-400"
          borderColor="border-blue-500"
          bgColor="bg-blue-600/10"
          iconBg="bg-blue-600/20"
          subtitle={loadingPackages ? undefined : `${packages.length} paquete${packages.length === 1 ? "" : "s"}`}
        />
        <MetricCard
          title="Disponibles"
          value={loadingPackages ? "—" : stats.remaining}
          icon={KeyRound}
          iconColor="text-green-400"
          borderColor="border-green-500"
          bgColor="bg-green-600/10"
          iconBg="bg-green-600/20"
          subtitle={
            loadingPackages ? undefined : stats.lowStock + stats.depleted > 0 ? (
              <span className="text-amber-400">
                {stats.lowStock} stock bajo · {stats.depleted} agotados
              </span>
            ) : (
              "Stock en buen nivel"
            )
          }
        />
        <MetricCard
          title="Activadas"
          value={loadingPackages ? "—" : stats.used}
          icon={ShieldCheck}
          iconColor="text-purple-400"
          borderColor="border-purple-500"
          bgColor="bg-purple-600/10"
          iconBg="bg-purple-600/20"
          subtitle={loadingPackages ? undefined : `${stats.usedPct}% del total`}
        />
        <MetricCard
          title="Activaciones en el periodo"
          value={loadingActivations ? "—" : activations.length}
          icon={CalendarCheck}
          iconColor="text-orange-400"
          borderColor="border-orange-500"
          bgColor="bg-orange-600/10"
          iconBg="bg-orange-600/20"
          subtitle={rangeLabel}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button onClick={() => setTab("activations")} className={`px-4 py-2 font-medium ${tab === "activations" ? "text-white border-b-2 border-blue-500" : "text-slate-400 hover:text-slate-200"}`}>
          Activaciones
        </button>
        <button onClick={() => setTab("packages")} className={`px-4 py-2 font-medium ${tab === "packages" ? "text-white border-b-2 border-blue-500" : "text-slate-400 hover:text-slate-200"}`}>
          Paquetes
        </button>
      </div>

      {tab === "activations" && (
        <div className="space-y-4">
          <LicenseFilters
            filters={filters}
            packages={packages}
            technicians={technicianOptions}
            onChange={setFilters}
            onReset={() => setFilters({})}
          />
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <button onClick={() => { setEditingActivation(null); setActivationFormOpen(true); }} className="btn-primary-dark flex items-center gap-2 px-4 py-2 rounded-xl">
              <Plus className="w-4 h-4" /> Nueva activación
            </button>
            <div className="flex gap-2">
              <button onClick={exportActivationsExcel} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded-xl">
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button onClick={exportActivationsPDF} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded-xl">
                <FileDown className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>
          <div className="card-dark-strong p-4">
            {loadingActivations ? (
              <p className="text-slate-400 text-center py-8">Cargando...</p>
            ) : (
              <LicenseActivationsTable
                activations={activations}
                onEdit={(a) => { setEditingActivation(a); setActivationFormOpen(true); }}
                onDelete={(a) => setActivationToDelete(a)}
              />
            )}
          </div>
        </div>
      )}

      {tab === "packages" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <button onClick={() => { setEditingPackage(null); setPackageFormOpen(true); }} className="btn-primary-dark flex items-center gap-2 px-4 py-2 rounded-xl">
              <Plus className="w-4 h-4" /> Nuevo paquete
            </button>
            <div className="flex gap-2">
              <button onClick={exportPackagesExcel} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded-xl">
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button onClick={exportPackagesPDF} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded-xl">
                <FileDown className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>
          <div className="card-dark-strong p-4">
            {loadingPackages ? (
              <p className="text-slate-400 text-center py-8">Cargando...</p>
            ) : (
              <LicensePackagesTable
                packages={packages}
                onEdit={(p) => { setEditingPackage(p); setPackageFormOpen(true); }}
                onDelete={(p) => setPackageToDelete(p)}
              />
            )}
          </div>
        </div>
      )}

      {/* Modal formulario paquete */}
      {packageFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <LicensePackageForm
            package={editingPackage}
            isLoading={mutatingPackages}
            onCancel={() => setPackageFormOpen(false)}
            onSubmit={(data) => {
              const onSuccess = () => setPackageFormOpen(false);
              if (editingPackage) updatePackage({ id: editingPackage.id, data }, { onSuccess });
              else createPackage(data, { onSuccess });
            }}
          />
        </div>
      )}

      {/* Modal formulario activación */}
      {activationFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <LicenseActivationForm
            activation={editingActivation}
            packages={packages}
            technicians={technicianOptions}
            isLoading={mutatingActivations}
            onCancel={() => setActivationFormOpen(false)}
            onSubmit={(data) => {
              const onSuccess = () => setActivationFormOpen(false);
              if (editingActivation) updateActivation({ id: editingActivation.id, data }, { onSuccess });
              else createActivation(data, { onSuccess });
            }}
          />
        </div>
      )}

      {/* Confirmaciones */}
      <ConfirmModal
        isOpen={!!packageToDelete}
        title="Eliminar paquete"
        message={`¿Eliminar el paquete ${packageToDelete?.code}? Esta acción no se puede deshacer.`}
        onConfirm={() => { if (packageToDelete) deletePackage(packageToDelete.id); setPackageToDelete(null); }}
        onCancel={() => setPackageToDelete(null)}
      />
      <ConfirmModal
        isOpen={!!activationToDelete}
        title="Eliminar activación"
        message={`¿Eliminar la activación de la clave ${activationToDelete?.licenseKey}? Esto devuelve una licencia al paquete.`}
        onConfirm={() => { if (activationToDelete) deleteActivation(activationToDelete.id); setActivationToDelete(null); }}
        onCancel={() => setActivationToDelete(null)}
      />
    </div>
  );
}
