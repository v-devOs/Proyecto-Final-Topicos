"use client";

import { useState } from "react";
import AppointmentsTable from "./AppointmentsTable";
import AppointmentModal from "./AppointmentModal";
import Pagination from "../ui/Pagination";
import { getPaginatedAppointments } from "@/app/actions/appointment/get-paginated-appointment";
import { deleteAppointmentAction } from "@/app/actions/appointment/delete-appointment";
import { createOrUpdateAppointmentAction } from "@/app/actions/appointment/create-update-appointment";

type Appointment = {
  id: number;
  patientId: number;
  staffId: number;
  appointmentDate: Date;
  startTime: Date;
  endTime: Date;
  status: string;
  consultationType: string | null;
  notes: string | null;
  consultationRoomId: number | null;
  createdAt: Date;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    nuControl: string;
    email: string;
  };
  staff: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  consultationRoom: {
    id: number;
    code: string;
    name: string;
    location: string;
  } | null;
};

type PaginationData = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type AppointmentsPageClientProps = {
  initialData: {
    appointments: Appointment[];
    pagination: PaginationData;
  };
};

export default function AppointmentsPageClient({ initialData }: AppointmentsPageClientProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialData.appointments);
  const [pagination, setPagination] = useState<PaginationData>(initialData.pagination);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const loadAppointments = async (page = pagination.page) => {
    setIsLoading(true);
    const result = await getPaginatedAppointments({
      page,
      pageSize: 10,
      status: selectedStatus ? (selectedStatus as "pending" | "confirmed" | "completed" | "cancelled" | "no_show") : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });

    if (result.success && result.data) {
      setAppointments(result.data.appointments);
      setPagination(result.data.pagination);
    }
    setIsLoading(false);
  };

  const handlePageChange = (page: number) => {
    loadAppointments(page);
  };

  const handleCreate = () => {
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleSuccess = () => {
    loadAppointments();
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    const confirmed = window.confirm(`¿Cambiar el estado de la cita a "${status}"?`);
    if (!confirmed) return;

    setIsLoading(true);
    const appointmentToUpdate = appointments.find((a) => a.id === id);
    if (appointmentToUpdate) {
      const result = await createOrUpdateAppointmentAction({
        id,
        patientId: appointmentToUpdate.patientId,
        staffId: appointmentToUpdate.staffId,
        appointmentDate: new Date(appointmentToUpdate.appointmentDate),
        startTime: new Date(appointmentToUpdate.startTime).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        endTime: new Date(appointmentToUpdate.endTime).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        status: status as "pending" | "confirmed" | "completed" | "cancelled" | "no_show",
        consultationType: appointmentToUpdate.consultationType,
        notes: appointmentToUpdate.notes,
        consultationRoomId: appointmentToUpdate.consultationRoomId,
      });

      if (result.success) {
        loadAppointments();
      } else {
        alert(result.message || "Error al actualizar el estado");
        setIsLoading(false);
      }
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "¿Estás seguro de eliminar permanentemente esta cita? Esta acción no se puede deshacer."
    );

    if (!confirmed) return;

    setIsLoading(true);
    const result = await deleteAppointmentAction(id);

    if (result.success) {
      loadAppointments();
    } else {
      alert(result.message || "Error al eliminar la cita");
      setIsLoading(false);
    }
  };

  // Calcular estadísticas
  const statusCounts = {
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Citas</h1>
        <button
          onClick={handleCreate}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          Nueva Cita
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Citas</p>
              <p className="text-2xl font-bold text-gray-800">{pagination.totalItems}</p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Confirmadas</p>
              <p className="text-2xl font-bold text-blue-600">{statusCounts.confirmed}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Completadas</p>
              <p className="text-2xl font-bold text-green-600">{statusCounts.completed}</p>
            </div>
            <div className="text-4xl">🎯</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
              <option value="no_show">No asistió</option>
            </select>
          </div>

          {/* Fecha Desde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Botón Filtrar */}
          <div className="flex items-end">
            <button
              onClick={() => loadAppointments(1)}
              className="w-full px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Buscando..." : "Filtrar"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-500">Cargando citas...</p>
        </div>
      ) : (
        <AppointmentsTable
          appointments={appointments}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onUpdateStatus={handleUpdateStatus}
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
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        appointment={selectedAppointment}
      />
    </div>
  );
}
