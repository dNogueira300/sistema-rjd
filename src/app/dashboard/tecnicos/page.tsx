// src/app/dashboard/tecnicos/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, FileDown, RefreshCw, X, Laptop, Wrench } from "lucide-react";
import { useTechnicians } from "@/hooks/useTechnicians";
import TechnicianForm from "@/components/technicians/TechnicianForm";
import TechnicianTable from "@/components/technicians/TechnicianTable";
import ConfirmModal from "@/components/clients/ConfirmModal";
import Pagination from "@/components/clients/Pagination";
import { formatPhone } from "@/lib/validations/technician";
import ExcelJS from "exceljs";
import type {
  Technician,
  CreateTechnicianData,
  UpdateTechnicianData,
} from "@/types/technician";

type ModalType = "create" | "edit" | "view" | "delete" | "toggle-status" | null;

export default function TecnicosPage() {
  const {
    technicians,
    totalTechnicians,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    filters,
    isLoading,
    isError,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    createTechnician,
    updateTechnician,
    deleteTechnician,
    updateFilters,
    refreshTechnicians,
    setCurrentPage,
  } = useTechnicians({
    initialFilters: { status: "ALL", sortBy: "name", sortOrder: "asc" },
  });

  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(
    null
  );

  // Handlers para modales
  const handleCreateClick = () => {
    setSelectedTechnician(null);
    setModalType("create");
  };

  const handleEditClick = (technician: Technician) => {
    setSelectedTechnician(technician);
    setModalType("edit");
  };

  const handleViewClick = (technician: Technician) => {
    setSelectedTechnician(technician);
    setModalType("view");
  };

  const handleDeleteClick = (technician: Technician) => {
    setSelectedTechnician(technician);
    setModalType("delete");
  };

  const handleToggleStatusClick = (technician: Technician) => {
    setSelectedTechnician(technician);
    setModalType("toggle-status");
  };

  const handleCloseModal = useCallback(() => {
    setModalType(null);
    setSelectedTechnician(null);
  }, []);

  // Manejar cierre de modales con tecla ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && modalType !== null) {
        // No cerrar si hay una operación en progreso
        if (isCreating || isUpdating || isDeleting) return;
        handleCloseModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalType, isCreating, isUpdating, isDeleting, handleCloseModal]);

  // Handler unificado para CREATE y UPDATE
  const handleFormSubmit = (data: CreateTechnicianData | UpdateTechnicianData) => {
    if (modalType === "create") {
      const createData = data as CreateTechnicianData;
      createTechnician(createData, {
        onSuccess: () => {
          handleCloseModal();
        },
      });
    } else if (modalType === "edit" && selectedTechnician) {
      const updateData = data as UpdateTechnicianData;
      updateTechnician(
        { id: selectedTechnician.id, data: updateData },
        {
          onSuccess: () => {
            handleCloseModal();
          },
        }
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!selectedTechnician) return;

    deleteTechnician(selectedTechnician.id, {
      onSuccess: () => {
        handleCloseModal();
      },
    });
  };

  const handleConfirmToggleStatus = () => {
    if (!selectedTechnician) return;

    const newStatus =
      selectedTechnician.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    updateTechnician(
      { id: selectedTechnician.id, data: { status: newStatus } },
      {
        onSuccess: () => {
          handleCloseModal();
        },
      }
    );
  };

  // Export data to Excel using ExcelJS
  const handleExport = async () => {
    if (technicians.length === 0) return;

    // Crear libro de trabajo
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistema RJD";
    workbook.created = new Date();

    // Crear hoja de trabajo
    const worksheet = workbook.addWorksheet("Técnicos");

    // Definir columnas con anchos
    worksheet.columns = [
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "Teléfono", key: "telefono", width: 18 },
      { header: "Estado", key: "estado", width: 12 },
      { header: "Equipos Asignados", key: "equipos", width: 20 },
      { header: "Fecha de Registro", key: "fechaRegistro", width: 18 },
    ];

    // Estilizar encabezados
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4A5568" },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Agregar datos
    technicians.forEach((technician) => {
      worksheet.addRow({
        nombre: technician.name,
        email: technician.email,
        telefono: technician.phone
          ? `+51 ${formatPhone(technician.phone)}`
          : "N/A",
        estado: technician.status === "ACTIVE" ? "Activo" : "Inactivo",
        equipos: technician.equipmentCount || 0,
        fechaRegistro: new Date(technician.createdAt).toLocaleDateString(),
      });
    });

    // Generar nombre de archivo con fecha
    const fecha = new Date().toISOString().split("T")[0];
    const fileName = `Tecnicos_RJD_${fecha}.xlsx`;

    // Generar buffer y descargar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Estadísticas rápidas
  const activeTechniciansCount = technicians.filter(
    (t) => t.status === "ACTIVE"
  ).length;
  const inactiveTechniciansCount = technicians.filter(
    (t) => t.status === "INACTIVE"
  ).length;
  const totalEquipments = technicians.reduce(
    (sum, technician) => sum + (technician.equipmentCount || 0),
    0
  );

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="card-dark p-12 text-center">
          <div className="text-red-400 mb-4">
            <Wrench className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-slate-100 mb-2">
            Error al cargar técnicos
          </h3>
          <p className="text-slate-400 mb-6">
            {error?.message ||
              "Hubo un problema al cargar la información de técnicos."}
          </p>
          <button
            onClick={refreshTechnicians}
            className="btn-primary-dark px-6 py-2 inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="card-dark p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 rounded-lg bg-linear-to-br from-cyan-600 to-cyan-700 shrink-0">
              <Wrench className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-slate-100 truncate">
                Gestión de Técnicos
              </h2>
              <p className="text-sm md:text-base text-slate-400 hidden sm:block">
                Administra el personal técnico del sistema
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-3 sm:justify-end">
            <button
              onClick={handleExport}
              className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 md:px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 text-sm md:text-base flex-1 sm:flex-none justify-center"
              disabled={isLoading || technicians.length === 0}
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden xs:inline">Exportar</span>
            </button>

            <button
              onClick={refreshTechnicians}
              className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 md:px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 text-sm md:text-base flex-1 sm:flex-none justify-center"
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              <span className="hidden xs:inline">Actualizar</span>
            </button>

            <button
              onClick={handleCreateClick}
              className="btn-primary-dark px-3 md:px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm md:text-base flex-1 sm:flex-none justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Técnico</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <div className="card-dark p-3 md:p-6 hover-lift bg-cyan-600/10 border-2 border-cyan-500">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-3 rounded-lg bg-cyan-600/20 shrink-0">
              <Wrench className="w-4 h-4 md:w-6 md:h-6 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg md:text-2xl font-bold text-slate-100">
                {totalTechnicians}
              </h3>
              <p className="text-xs md:text-sm text-slate-400 truncate">
                Total
              </p>
            </div>
          </div>
        </div>

        <div className="card-dark p-3 md:p-6 hover-lift bg-green-600/10 border-2 border-green-500">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-3 rounded-lg bg-green-600/20 shrink-0">
              <Users className="w-4 h-4 md:w-6 md:h-6 text-green-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg md:text-2xl font-bold text-slate-100">
                {activeTechniciansCount}
              </h3>
              <p className="text-xs md:text-sm text-slate-400 truncate">
                Activos
              </p>
            </div>
          </div>
        </div>

        <div className="card-dark p-3 md:p-6 hover-lift bg-gray-600/10 border-2 border-gray-500">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-3 rounded-lg bg-gray-600/20 shrink-0">
              <Users className="w-4 h-4 md:w-6 md:h-6 text-gray-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg md:text-2xl font-bold text-slate-100">
                {inactiveTechniciansCount}
              </h3>
              <p className="text-xs md:text-sm text-slate-400 truncate">
                Inactivos
              </p>
            </div>
          </div>
        </div>

        <div className="card-dark p-3 md:p-6 hover-lift bg-blue-600/10 border-2 border-blue-500">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-3 rounded-lg bg-blue-600/20 shrink-0">
              <Laptop className="w-4 h-4 md:w-6 md:h-6 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg md:text-2xl font-bold text-slate-100">
                {totalEquipments}
              </h3>
              <p className="text-xs md:text-sm text-slate-400 truncate">
                Equipos Asignados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technician Table */}
      <TechnicianTable
        technicians={technicians}
        filters={filters}
        onFiltersChange={updateFilters}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onView={handleViewClick}
        onToggleStatus={handleToggleStatusClick}
        isLoading={isLoading}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
      />

      {/* Modales */}
      {/* Create/Edit Modal */}
      {(modalType === "create" || modalType === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div className="relative w-full max-w-2xl mx-auto max-h-[95vh] overflow-y-auto">
            <TechnicianForm
              technician={selectedTechnician}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseModal}
              isLoading={modalType === "create" ? isCreating : isUpdating}
              title={
                modalType === "create" ? "Nuevo Técnico" : "Editar Técnico"
              }
            />
          </div>
        </div>
      )}

      {/* View Modal */}
      {modalType === "view" && selectedTechnician && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div className="relative card-dark-strong p-4 md:p-6 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-lg md:text-2xl font-bold text-slate-100">
                Detalles del Técnico
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="text-xs md:text-sm font-medium text-slate-300">
                  Nombre
                </label>
                <p className="text-slate-100 text-base md:text-lg">
                  {selectedTechnician.name}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="text-xs md:text-sm font-medium text-slate-300">
                    Email
                  </label>
                  <p className="text-slate-100 text-sm md:text-base">
                    {selectedTechnician.email}
                  </p>
                </div>

                <div>
                  <label className="text-xs md:text-sm font-medium text-slate-300">
                    Teléfono
                  </label>
                  <p className="text-slate-100 text-sm md:text-base">
                    {selectedTechnician.phone
                      ? `+51 ${formatPhone(selectedTechnician.phone)}`
                      : "No registrado"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 pt-3 md:pt-4 border-t border-slate-700">
                <div>
                  <label className="text-xs md:text-sm font-medium text-slate-300">
                    Equipos Asignados
                  </label>
                  <p className="text-slate-100 text-xl md:text-2xl font-bold">
                    {selectedTechnician.equipmentCount || 0}
                  </p>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium text-slate-300">
                    Estado
                  </label>
                  <span
                    className={`inline-block px-2 md:px-3 py-1 rounded-full text-xs font-medium ${
                      selectedTechnician.status === "ACTIVE"
                        ? "bg-green-600/20 text-green-400"
                        : "bg-gray-600/20 text-gray-400"
                    }`}
                  >
                    {selectedTechnician.status === "ACTIVE"
                      ? "Activo"
                      : "Inactivo"}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <label className="text-xs md:text-sm font-medium text-slate-300">
                  Fecha de Registro
                </label>
                <p className="text-slate-100 text-sm md:text-base">
                  {new Date(selectedTechnician.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-4 md:mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 py-2.5 md:py-3 rounded-xl transition-colors text-sm md:text-base"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  handleCloseModal();
                  handleEditClick(selectedTechnician);
                }}
                className="btn-primary-dark flex-1 py-2.5 md:py-3 text-sm md:text-base"
              >
                Editar Técnico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={modalType === "delete"}
        title="Eliminar Técnico"
        message={
          selectedTechnician
            ? `¿Estás seguro de que deseas eliminar a ${selectedTechnician.name}? Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        confirmButtonColor="red"
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseModal}
        isLoading={isDeleting}
      />

      {/* Toggle Status Confirmation Modal */}
      <ConfirmModal
        isOpen={modalType === "toggle-status"}
        title={
          selectedTechnician?.status === "ACTIVE"
            ? "Desactivar Técnico"
            : "Activar Técnico"
        }
        message={
          selectedTechnician
            ? selectedTechnician.status === "ACTIVE"
              ? `¿Deseas desactivar a ${selectedTechnician.name}? No podrá ser asignado a nuevos equipos.`
              : `¿Deseas activar a ${selectedTechnician.name}? Estará disponible para asignación de equipos.`
            : ""
        }
        confirmLabel={
          selectedTechnician?.status === "ACTIVE" ? "Desactivar" : "Activar"
        }
        cancelLabel="Cancelar"
        confirmButtonColor={
          selectedTechnician?.status === "ACTIVE" ? "red" : "green"
        }
        onConfirm={handleConfirmToggleStatus}
        onCancel={handleCloseModal}
        isLoading={isUpdating}
      />
    </div>
  );
}
