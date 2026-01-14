// src/app/dashboard/equipos/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Laptop,
  Plus,
  RefreshCw,
  Clock,
  Wrench,
  CheckCircle,
  Truck,
} from "lucide-react";
import { useEquipments, useEquipment } from "@/hooks/useEquipments";
import EquipmentTable from "@/components/equipment/EquipmentTable";
import EquipmentForm from "@/components/equipment/EquipmentForm";
import EquipmentManageFullModal from "@/components/equipment/EquipmentManageFullModal";
import Pagination from "@/components/clients/Pagination";
import ConfirmModal from "@/components/clients/ConfirmModal";
import type {
  Equipment,
  CreateEquipmentData,
  UpdateEquipmentData,
} from "@/types/equipment";

type ModalType = "create" | "edit" | "manage" | "delete" | null;

export default function EquiposPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const userRole =
    (session?.user?.role as "ADMINISTRADOR" | "TECNICO") || "TECNICO";

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
    createEquipment,
    updateEquipment,
    deleteEquipment,
    updateFilters,
    refreshEquipments,
    setCurrentPage,
  } = useEquipments();

  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null
  );
  const [viewEquipmentId, setViewEquipmentId] = useState<string | null>(null);

  // Hook para obtener equipo completo con pagos cuando se abre modal de detalles
  const { data: equipmentDetail } = useEquipment(viewEquipmentId);

  // Usar datos del detalle si están disponibles, sino usar el equipo seleccionado básico
  const displayEquipment = equipmentDetail?.equipment ?? selectedEquipment;

  // Handlers para modales
  const handleOpenCreate = useCallback(() => {
    setSelectedEquipment(null);
    setModalType("create");
  }, []);

  const handleOpenEdit = useCallback((equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setModalType("edit");
  }, []);

  const handleOpenManage = useCallback((equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setViewEquipmentId(equipment.id); // Cargar datos completos con pagos
    setModalType("manage");
  }, []);

  const handleOpenDelete = useCallback((equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setModalType("delete");
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalType(null);
    setSelectedEquipment(null);
    setViewEquipmentId(null);
  }, []);

  // Handlers para CRUD
  const handleCreateSubmit = useCallback(
    (
      data: CreateEquipmentData | UpdateEquipmentData,
      extraData?: {
        assignedTechnicianId?: string;
        payment?: { type: string; amount: number; method: string };
      }
    ) => {
      // Combinar data con extraData para enviar todo junto a la API
      const fullData = {
        ...data,
        assignedTechnicianId: extraData?.assignedTechnicianId || null,
        payment: extraData?.payment,
      };
      createEquipment(fullData as CreateEquipmentData, {
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

  const handleManageSuccess = useCallback(() => {
    // Invalidar queries para refrescar datos
    queryClient.invalidateQueries({ queryKey: ["equipments"] });
    queryClient.invalidateQueries({ queryKey: ["finance-metrics"] });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    if (viewEquipmentId) {
      queryClient.invalidateQueries({
        queryKey: ["equipment", viewEquipmentId],
      });
    }
  }, [queryClient, viewEquipmentId]);

  // Contar equipos por estado
  const receivedCount = equipments.filter(
    (e) => e.status === "RECEIVED"
  ).length;
  const repairCount = equipments.filter((e) => e.status === "REPAIR").length;
  const deliveredCount = equipments.filter(
    (e) => e.status === "DELIVERED"
  ).length;

  // Stats cards
  const stats = [
    {
      label: "Total Equipos",
      value: totalEquipments,
      icon: <Laptop className="w-5 h-5 md:w-6 md:h-6" />,
      iconColor: "text-blue-400",
      borderColor: "border-blue-500",
      bgColor: "bg-blue-600/10",
      iconBg: "bg-blue-600/20",
    },
    {
      label: "Recibidos",
      value: receivedCount,
      icon: <Clock className="w-5 h-5 md:w-6 md:h-6" />,
      iconColor: "text-purple-400",
      borderColor: "border-purple-500",
      bgColor: "bg-purple-600/10",
      iconBg: "bg-purple-600/20",
    },
    {
      label: "En Reparación",
      value: repairCount,
      icon: <Wrench className="w-5 h-5 md:w-6 md:h-6" />,
      iconColor: "text-yellow-400",
      borderColor: "border-yellow-500",
      bgColor: "bg-yellow-600/10",
      iconBg: "bg-yellow-600/20",
    },
    {
      label: "Reparados",
      value: repairedCount,
      icon: <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />,
      iconColor: "text-blue-400",
      borderColor: "border-blue-500",
      bgColor: "bg-blue-600/10",
      iconBg: "bg-blue-600/20",
      highlight: repairedCount > 0,
    },
    {
      label: "Entregados",
      value: deliveredCount,
      icon: <Truck className="w-5 h-5 md:w-6 md:h-6" />,
      iconColor: "text-green-400",
      borderColor: "border-green-500",
      bgColor: "bg-green-600/10",
      iconBg: "bg-green-600/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-dark p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-linear-to-br from-blue-600 to-blue-700">
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
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={refreshEquipments}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors shrink-0"
              title="Actualizar lista"
            >
              <RefreshCw
                className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
            {userRole === "ADMINISTRADOR" && (
              <button
                onClick={handleOpenCreate}
                className="btn-primary-dark flex items-center justify-center gap-2 px-4 py-2 flex-1 md:flex-initial"
              >
                <Plus className="w-5 h-5" />
                <span>Nuevo Equipo</span>
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
            className={`card-dark p-3 md:p-4 hover-lift border-2 ${
              stat.borderColor
            } ${stat.bgColor} ${
              stat.highlight ? "ring-2 ring-blue-500/50 animate-pulse" : ""
            }`}
          >
            <div className="flex items-center gap-2 md:gap-3">
              <div className={`p-2 md:p-3 rounded-lg ${stat.iconBg} shrink-0`}>
                <span className={stat.iconColor}>{stat.icon}</span>
              </div>
              <div className="min-w-0">
                <h3 className="text-lg md:text-2xl font-bold text-slate-100">
                  {stat.value}
                </h3>
                <p className="text-xs md:text-sm text-slate-400 truncate">
                  {stat.label}
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
        onView={handleOpenManage}
        onManageStatus={handleOpenManage}
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

      {/* Manage Modal - Modal completo de gestión */}
      {modalType === "manage" && displayEquipment && (
        <EquipmentManageFullModal
          equipment={displayEquipment}
          userRole={userRole}
          onClose={handleCloseModal}
          onSuccess={handleManageSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={modalType === "delete" && selectedEquipment !== null}
        title="Eliminar Equipo"
        message={
          selectedEquipment
            ? `¿Estás seguro de que deseas eliminar el equipo ${selectedEquipment.code}? Esta acción no se puede deshacer.`
            : ""
        }
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
