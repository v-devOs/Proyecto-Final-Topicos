"use client";

import { useState } from "react";
import ConsultationRoomsTable from "./ConsultationRoomsTable";
import ConsultationRoomModal from "./ConsultationRoomModal";
import Pagination from "../ui/Pagination";
import { getPaginatedConsultationRooms } from "@/app/actions/consultation-room/get-paginated-consultation-room";
import { deleteConsultationRoom } from "@/app/actions/consultation-room/delete-consultation-room";

type ConsultationRoom = {
  id: number;
  code: string;
  name: string;
  location: string;
  capacity: number;
  active: boolean;
  _count?: {
    staff: number;
    appointments: number;
  };
};

type PaginationData = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type ConsultationRoomsPageClientProps = {
  initialData: {
    consultationRooms: ConsultationRoom[];
    pagination: PaginationData;
  };
};

export default function ConsultationRoomsPageClient({
  initialData,
}: ConsultationRoomsPageClientProps) {
  const [consultationRooms, setConsultationRooms] = useState<ConsultationRoom[]>(
    initialData.consultationRooms
  );
  const [pagination, setPagination] = useState<PaginationData>(initialData.pagination);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ConsultationRoom | null>(null);

  const loadConsultationRooms = async (page = pagination.page) => {
    setIsLoading(true);
    const result = await getPaginatedConsultationRooms({
      page,
      pageSize: 10,
      search: searchTerm,
      activeOnly,
    });

    if (result.success && result.data) {
      setConsultationRooms(result.data.consultationRooms);
      setPagination(result.data.pagination);
    }
    setIsLoading(false);
  };

  const handleSearch = () => {
    loadConsultationRooms(1);
  };

  const handlePageChange = (page: number) => {
    loadConsultationRooms(page);
  };

  const handleCreate = () => {
    setSelectedRoom(null);
    setIsModalOpen(true);
  };

  const handleEdit = (room: ConsultationRoom) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
  };

  const handleSuccess = () => {
    loadConsultationRooms();
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    const confirmed = window.confirm(
      currentStatus
        ? "¿Deseas desactivar este consultorio?"
        : "¿Deseas activar este consultorio?"
    );

    if (!confirmed) return;

    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("active", (!currentStatus).toString());

    setIsLoading(true);
    const result = await import("@/app/actions/consultation-room/create-or-update-consultation-room").then(
      (m) => m.createOrUpdateConsultationRoom(formData)
    );

    if (result.success) {
      loadConsultationRooms();
    } else {
      alert(result.message || "Error al actualizar el consultorio");
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "¿Estás seguro de eliminar permanentemente este consultorio? Esta acción no se puede deshacer."
    );

    if (!confirmed) return;

    setIsLoading(true);
    const result = await deleteConsultationRoom(id);

    if (result.success) {
      loadConsultationRooms();
    } else {
      alert(result.message || "Error al eliminar el consultorio");
      setIsLoading(false);
    }
  };

  // Calcular estadísticas
  const totalStaff = consultationRooms.reduce(
    (acc, room) => acc + (room._count?.staff || 0),
    0
  );
  const totalAppointments = consultationRooms.reduce(
    (acc, room) => acc + (room._count?.appointments || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Gestión de Consultorios
        </h1>
        <button
          onClick={handleCreate}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          Nuevo Consultorio
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Consultorios</p>
              <p className="text-2xl font-bold text-gray-800">
                {pagination.totalItems}
              </p>
            </div>
            <div className="text-4xl">🏢</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Personal Asignado</p>
              <p className="text-2xl font-bold text-gray-800">{totalStaff}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Citas</p>
              <p className="text-2xl font-bold text-gray-800">
                {totalAppointments}
              </p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por código, nombre o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "Buscando..." : "Buscar"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="activeOnly"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="activeOnly" className="text-sm text-gray-700">
            Mostrar solo activos
          </label>
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-500">Cargando consultorios...</p>
        </div>
      ) : (
        <ConsultationRoomsTable
          consultationRooms={consultationRooms}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      )}

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Modal */}
      <ConsultationRoomModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        room={selectedRoom}
      />
    </div>
  );
}
