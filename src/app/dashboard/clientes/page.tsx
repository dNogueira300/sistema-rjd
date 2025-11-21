// src/app/dashboard/clientes/page.tsx
"use client";

import { useState } from "react";
import { Users, Plus, FileDown, RefreshCw, X, Laptop } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import ClientForm from "@/components/clients/ClientForm";
import ClientTable from "@/components/clients/ClientTable"; // Cambiado de ClientList
import ConfirmModal from "@/components/clients/ConfirmModal";
import Pagination from "@/components/clients/Pagination";
import { formatPhone, formatRUC } from "@/lib/validations/client";
import ExcelJS from "exceljs";
import type {
  Client,
  CreateClientData,
  UpdateClientData,
} from "@/types/client";

type ModalType = "create" | "edit" | "view" | "delete" | null;

export default function ClientesPage() {
  const {
    clients,
    totalClients,
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
    createClient,
    updateClient,
    deleteClient,
    updateFilters,
    refreshClients,
    setCurrentPage,
  } = useClients({
    initialFilters: { status: "ALL", sortBy: "name", sortOrder: "asc" },
  });

  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Handlers para modales
  const handleCreateClick = () => {
    setSelectedClient(null);
    setModalType("create");
  };

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setModalType("edit");
  };

  const handleViewClick = (client: Client) => {
    setSelectedClient(client);
    setModalType("view");
  };

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client);
    setModalType("delete");
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedClient(null);
  };

  // Handler unificado para CREATE y UPDATE
  const handleFormSubmit = (data: CreateClientData | UpdateClientData) => {
    if (modalType === "create") {
      const createData = data as CreateClientData;
      createClient(createData, {
        onSuccess: () => {
          handleCloseModal();
        },
      });
    } else if (modalType === "edit" && selectedClient) {
      const updateData = data as UpdateClientData;
      updateClient(
        { id: selectedClient.id, data: updateData },
        {
          onSuccess: () => {
            handleCloseModal();
          },
        }
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!selectedClient) return;

    deleteClient(selectedClient.id, {
      onSuccess: () => {
        handleCloseModal();
      },
    });
  };

  // Export data to Excel using ExcelJS (secure alternative to xlsx)
  const handleExport = async () => {
    if (clients.length === 0) return;

    // Crear libro de trabajo
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistema RJD";
    workbook.created = new Date();

    // Crear hoja de trabajo
    const worksheet = workbook.addWorksheet("Clientes");

    // Definir columnas con anchos
    worksheet.columns = [
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "Teléfono", key: "telefono", width: 18 },
      { header: "RUC", key: "ruc", width: 18 },
      { header: "Estado", key: "estado", width: 12 },
      { header: "Equipos Registrados", key: "equipos", width: 20 },
      { header: "Última Visita", key: "ultimaVisita", width: 15 },
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
    clients.forEach((client) => {
      worksheet.addRow({
        nombre: client.name,
        telefono: `+51 ${formatPhone(client.phone)}`,
        ruc: client.ruc ? formatRUC(client.ruc) : "N/A",
        estado: client.status === "ACTIVE" ? "Activo" : "Inactivo",
        equipos: client.equipmentCount || 0,
        ultimaVisita: client.lastVisit || "Nunca",
        fechaRegistro: new Date(client.createdAt).toLocaleDateString(),
      });
    });

    // Generar nombre de archivo con fecha
    const fecha = new Date().toISOString().split("T")[0];
    const fileName = `Clientes_RJD_${fecha}.xlsx`;

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
  const activeClientsCount = clients.filter(
    (c) => c.status === "ACTIVE"
  ).length;
  const inactiveClientsCount = clients.filter(
    (c) => c.status === "INACTIVE"
  ).length;
  const totalEquipments = clients.reduce(
    (sum, client) => sum + (client.equipmentCount || 0),
    0
  );

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="card-dark p-12 text-center">
          <div className="text-red-400 mb-4">
            <Users className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-slate-100 mb-2">
            Error al cargar clientes
          </h3>
          <p className="text-slate-400 mb-6">
            {error?.message ||
              "Hubo un problema al cargar la información de clientes."}
          </p>
          <button
            onClick={refreshClients}
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
            <div className="p-2 md:p-3 rounded-lg bg-linear-to-br from-purple-600 to-purple-700 shrink-0">
              <Users className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-slate-100 truncate">
                Gestión de Clientes
              </h2>
              <p className="text-sm md:text-base text-slate-400 hidden sm:block">
                Administra tu cartera de clientes y su información
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-3 sm:justify-end">
            <button
              onClick={handleExport}
              className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 md:px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 text-sm md:text-base flex-1 sm:flex-none justify-center"
              disabled={isLoading || clients.length === 0}
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden xs:inline">Exportar</span>
            </button>

            <button
              onClick={refreshClients}
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
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <div className="card-dark p-3 md:p-6 hover-lift bg-purple-600/10 border-2 border-purple-600/30">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-3 rounded-lg bg-purple-600/20 shrink-0">
              <Users className="w-4 h-4 md:w-6 md:h-6 text-purple-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg md:text-2xl font-bold text-slate-100">
                {totalClients}
              </h3>
              <p className="text-xs md:text-sm text-slate-400 truncate">
                Total
              </p>
            </div>
          </div>
        </div>

        <div className="card-dark p-3 md:p-6 hover-lift bg-green-600/10 border-2 border-green-600/30">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-3 rounded-lg bg-green-600/20 shrink-0">
              <Users className="w-4 h-4 md:w-6 md:h-6 text-green-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg md:text-2xl font-bold text-slate-100">
                {activeClientsCount}
              </h3>
              <p className="text-xs md:text-sm text-slate-400 truncate">
                Activos
              </p>
            </div>
          </div>
        </div>

        <div className="card-dark p-3 md:p-6 hover-lift bg-gray-600/10 border-2 border-gray-600/30">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-3 rounded-lg bg-gray-600/20 shrink-0">
              <Users className="w-4 h-4 md:w-6 md:h-6 text-gray-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg md:text-2xl font-bold text-slate-100">
                {inactiveClientsCount}
              </h3>
              <p className="text-xs md:text-sm text-slate-400 truncate">
                Inactivos
              </p>
            </div>
          </div>
        </div>

        <div className="card-dark p-3 md:p-6 hover-lift bg-blue-600/10 border-2 border-blue-600/30">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-3 rounded-lg bg-blue-600/20 shrink-0">
              <Laptop className="w-4 h-4 md:w-6 md:h-6 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg md:text-2xl font-bold text-slate-100">
                {totalEquipments}
              </h3>
              <p className="text-xs md:text-sm text-slate-400 truncate">
                Equipos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Client Table - CAMBIADO DE ClientList A ClientTable */}
      <ClientTable
        clients={clients}
        filters={filters}
        onFiltersChange={updateFilters}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onView={handleViewClick}
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
            <ClientForm
              client={selectedClient}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseModal}
              isLoading={modalType === "create" ? isCreating : isUpdating}
              title={
                modalType === "create" ? "Nuevo Cliente" : "Editar Cliente"
              }
            />
          </div>
        </div>
      )}

      {/* View Modal */}
      {modalType === "view" && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div className="relative card-dark-strong p-4 md:p-6 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-lg md:text-2xl font-bold text-slate-100">
                Detalles del Cliente
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
                  {selectedClient.name}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="text-xs md:text-sm font-medium text-slate-300">
                    Teléfono
                  </label>
                  <p className="text-slate-100 text-sm md:text-base">
                    +51 {formatPhone(selectedClient.phone)}
                  </p>
                </div>

                {selectedClient.ruc && (
                  <div>
                    <label className="text-xs md:text-sm font-medium text-slate-300">
                      RUC
                    </label>
                    <p className="text-slate-100 text-sm md:text-base">
                      {formatRUC(selectedClient.ruc)}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 pt-3 md:pt-4 border-t border-slate-700">
                <div>
                  <label className="text-xs md:text-sm font-medium text-slate-300">
                    Equipos
                  </label>
                  <p className="text-slate-100 text-xl md:text-2xl font-bold">
                    {selectedClient.equipmentCount || 0}
                  </p>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium text-slate-300">
                    Última Visita
                  </label>
                  <p className="text-slate-100 text-sm md:text-base">
                    {selectedClient.lastVisit || "Nunca"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2">
                <div>
                  <label className="text-xs md:text-sm font-medium text-slate-300">
                    Registro
                  </label>
                  <p className="text-slate-100 text-sm md:text-base">
                    {new Date(selectedClient.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium text-slate-300">
                    Estado
                  </label>
                  <span
                    className={`inline-block px-2 md:px-3 py-1 rounded-full text-xs font-medium ${
                      selectedClient.status === "ACTIVE"
                        ? "bg-green-600/20 text-green-400"
                        : "bg-gray-600/20 text-gray-400"
                    }`}
                  >
                    {selectedClient.status === "ACTIVE" ? "Activo" : "Inactivo"}
                  </span>
                </div>
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
                  handleEditClick(selectedClient);
                }}
                className="btn-primary-dark flex-1 py-2.5 md:py-3 text-sm md:text-base"
              >
                Editar Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={modalType === "delete"}
        title="Eliminar Cliente"
        message={
          selectedClient
            ? `¿Estás seguro de que deseas eliminar a ${selectedClient.name}? Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        confirmButtonColor="red"
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseModal}
        isLoading={isDeleting}
      />
    </div>
  );
}
