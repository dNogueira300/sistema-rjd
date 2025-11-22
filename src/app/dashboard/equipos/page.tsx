// src/app/dashboard/equipos/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Laptop,
  Plus,
  RefreshCw,
  Clock,
  Wrench,
  CheckCircle,
  Truck,
  X,
  User,
  Phone,
  Calendar,
} from "lucide-react";
import { useEquipments } from "@/hooks/useEquipments";
import EquipmentTable from "@/components/equipment/EquipmentTable";
import EquipmentForm from "@/components/equipment/EquipmentForm";
import StatusManager from "@/components/equipment/StatusManager";
import Pagination from "@/components/clients/Pagination";
import ConfirmModal from "@/components/clients/ConfirmModal";
import { formatPhone } from "@/lib/validations/client";
import type {
  Equipment,
  CreateEquipmentData,
  UpdateEquipmentData,
  ChangeStatusData,
} from "@/types/equipment";

type ModalType = "create" | "edit" | "view" | "delete" | "status" | null;

export default function EquiposPage() {
  const { data: session } = useSession();
  const userRole = (session?.user?.role as "ADMINISTRADOR" | "TECNICO") || "TECNICO";

  const {
    equipments,
    totalEquipments,
    totalPages,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    filters,
    repairedCount,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isChangingStatus,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    changeStatus,
    updateFilters,
    refreshEquipments,
    setCurrentPage,
  } = useEquipments();

  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  // Handlers para modales
  const handleOpenCreate = useCallback(() => {
    setSelectedEquipment(null);
    setModalType("create");
  }, []);

  const handleOpenEdit = useCallback((equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setModalType("edit");
  }, []);

  const handleOpenView = useCallback((equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setModalType("view");
  }, []);

  const handleOpenDelete = useCallback((equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setModalType("delete");
  }, []);

  const handleOpenStatus = useCallback((equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setModalType("status");
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalType(null);
    setSelectedEquipment(null);
  }, []);

  // Handlers para CRUD
  const handleCreateSubmit = useCallback(
    (data: CreateEquipmentData | UpdateEquipmentData) => {
      createEquipment(data as CreateEquipmentData, {
        onSuccess: () => {
          handleCloseModal();
        },
      });
    },
    [createEquipment, handleCloseModal]
  );

  const handleEditSubmit = useCallback(
    (data: CreateEquipmentData | UpdateEquipmentData) => {
      if (selectedEquipment) {
        updateEquipment(
          { id: selectedEquipment.id, data: data as UpdateEquipmentData },
          {
            onSuccess: () => {
              handleCloseModal();
            },
          }
        );
      }
    },
    [selectedEquipment, updateEquipment, handleCloseModal]
  );

  const handleDeleteConfirm = useCallback(() => {
    if (selectedEquipment) {
      deleteEquipment(selectedEquipment.id, {
        onSuccess: () => {
          handleCloseModal();
        },
      });
    }
  }, [selectedEquipment, deleteEquipment, handleCloseModal]);

  const handleStatusChange = useCallback(
    (data: ChangeStatusData) => {
      changeStatus(data, {
        onSuccess: () => {
          handleCloseModal();
        },
      });
    },
    [changeStatus, handleCloseModal]
  );

  // Contar equipos por estado
  const receivedCount = equipments.filter((e) => e.status === "RECEIVED").length;
  const repairCount = equipments.filter((e) => e.status === "REPAIR").length;
  const deliveredCount = equipments.filter((e) => e.status === "DELIVERED").length;

  // Stats cards
  const stats = [
    {
      label: "Total Equipos",
      value: totalEquipments,
      icon: <Laptop className="w-6 h-6" />,
      color: "from-blue-600 to-blue-700",
      textColor: "text-blue-400",
    },
    {
      label: "Recibidos",
      value: receivedCount,
      icon: <Clock className="w-6 h-6" />,
      color: "from-blue-600 to-blue-700",
      textColor: "text-blue-400",
    },
    {
      label: "En Reparación",
      value: repairCount,
      icon: <Wrench className="w-6 h-6" />,
      color: "from-yellow-600 to-yellow-700",
      textColor: "text-yellow-400",
    },
    {
      label: "Reparados",
      value: repairedCount,
      icon: <CheckCircle className="w-6 h-6" />,
      color: "from-green-600 to-green-700",
      textColor: "text-green-400",
      highlight: repairedCount > 0,
    },
    {
      label: "Entregados",
      value: deliveredCount,
      icon: <Truck className="w-6 h-6" />,
      color: "from-purple-600 to-purple-700",
      textColor: "text-purple-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-dark p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
              <Laptop className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-100">
                Gestión de Equipos
              </h2>
              <p className="text-sm text-slate-400">
                Registro y seguimiento de equipos en servicio
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshEquipments}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
              title="Actualizar lista"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            {userRole === "ADMINISTRADOR" && (
              <button
                onClick={handleOpenCreate}
                className="btn-primary-dark flex items-center gap-2 px-4 py-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Nuevo Equipo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`card-dark p-3 md:p-4 ${
              stat.highlight ? "ring-2 ring-green-500/50 animate-pulse" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} text-white`}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className={`text-xl md:text-2xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Equipment Table */}
      <EquipmentTable
        equipments={equipments}
        filters={filters}
        onFiltersChange={updateFilters}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        onView={handleOpenView}
        onManageStatus={handleOpenStatus}
        isLoading={isLoading}
        userRole={userRole}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modals */}
      {/* Create Modal */}
      {modalType === "create" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <EquipmentForm
              onSubmit={handleCreateSubmit}
              onCancel={handleCloseModal}
              isLoading={isCreating}
              title="Registrar Nuevo Equipo"
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modalType === "edit" && selectedEquipment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <EquipmentForm
              equipment={selectedEquipment}
              onSubmit={handleEditSubmit}
              onCancel={handleCloseModal}
              isLoading={isUpdating}
              title="Editar Equipo"
            />
          </div>
        </div>
      )}

      {/* View Modal */}
      {modalType === "view" && selectedEquipment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-slate-100">
                    Detalles del Equipo
                  </h2>
                  <p className="text-sm text-slate-400 font-mono mt-1">
                    {selectedEquipment.code}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {/* Cliente */}
              {selectedEquipment.customer && (
                <div className="glass-dark p-4 rounded-lg border border-slate-600">
                  <h3 className="text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-400" />
                    Cliente
                  </h3>
                  <p className="text-slate-100 font-medium">
                    {selectedEquipment.customer.name}
                  </p>
                  <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" />
                    +51 {formatPhone(selectedEquipment.customer.phone)}
                  </p>
                </div>
              )}

              {/* Equipo Info */}
              <div className="glass-dark p-4 rounded-lg border border-slate-600">
                <h3 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-blue-400" />
                  Información del Equipo
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">Tipo:</span>
                    <p className="text-slate-200">{selectedEquipment.type}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Marca:</span>
                    <p className="text-slate-200">{selectedEquipment.brand || "-"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Modelo:</span>
                    <p className="text-slate-200">{selectedEquipment.model || "-"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">N° Serie:</span>
                    <p className="text-slate-200 font-mono text-xs">
                      {selectedEquipment.serialNumber || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Servicio */}
              <div className="glass-dark p-4 rounded-lg border border-slate-600">
                <h3 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-yellow-400" />
                  Servicio
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-slate-500">Falla Reportada:</span>
                    <p className="text-slate-200 mt-1">
                      {selectedEquipment.reportedFlaw}
                    </p>
                  </div>
                  {selectedEquipment.serviceType && (
                    <div>
                      <span className="text-slate-500">Tipo de Servicio:</span>
                      <p className="text-slate-200">{selectedEquipment.serviceType}</p>
                    </div>
                  )}
                  {selectedEquipment.accessories && (
                    <div>
                      <span className="text-slate-500">Accesorios:</span>
                      <p className="text-slate-200">{selectedEquipment.accessories}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Estado y Fechas */}
              <div className="glass-dark p-4 rounded-lg border border-slate-600">
                <h3 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-400" />
                  Estado y Fechas
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">Estado:</span>
                    <p className="text-slate-200">{selectedEquipment.status}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Técnico:</span>
                    <p className="text-slate-200">
                      {selectedEquipment.assignedTechnician?.name || "Sin asignar"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Fecha Ingreso:</span>
                    <p className="text-slate-200">
                      {new Date(selectedEquipment.entryDate).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedEquipment.deliveryDate && (
                    <div>
                      <span className="text-slate-500">Fecha Entrega:</span>
                      <p className="text-slate-200">
                        {new Date(selectedEquipment.deliveryDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 md:p-6 border-t border-slate-700">
              <button
                onClick={handleCloseModal}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 py-3 px-4 rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Manager Modal */}
      {modalType === "status" && selectedEquipment && (
        <StatusManager
          equipment={selectedEquipment}
          userRole={userRole}
          onStatusChange={handleStatusChange}
          onClose={handleCloseModal}
          isLoading={isChangingStatus}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={modalType === "delete" && selectedEquipment !== null}
        title="Eliminar Equipo"
        message={selectedEquipment ? `¿Estás seguro de que deseas eliminar el equipo ${selectedEquipment.code}? Esta acción no se puede deshacer.` : ""}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={handleCloseModal}
        isLoading={isDeleting}
        confirmButtonColor="red"
      />
    </div>
  );
}
