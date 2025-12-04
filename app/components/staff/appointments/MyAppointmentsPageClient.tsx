"use client";

import { useState } from "react";
import MyAppointmentsTable from "./MyAppointmentsTable";
import MyAppointmentModal from "./MyAppointmentModal";
import { createOrUpdateAppointmentAction } from "@/app/actions/appointment/create-update-appointment";

type Appointment = {
  id: number;
  patientId: number;
  appointmentDate: Date;
  startTime: Date;
  endTime: Date;
  status: string;
  consultationType: string | null;
  notes: string | null;
  consultationRoomId: number | null;
  patient: {
    id: number;
    email: string;
  };
  consultationRoom: {
    id: number;
    code: string;
    name: string;
    location: string;
  } | null;
};

type ConsultationRoom = {
  id: number;
  code: string;
  name: string;
  location: string;
};

type MyAppointmentsPageClientProps = {
  initialAppointments: Appointment[];
  consultationRooms: ConsultationRoom[];
  currentStaffId: number;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendientes",
  confirmed: "Confirmadas",
  completed: "Completadas",
  cancelled: "Canceladas",
  no_show: "No asistieron",
};

export default function MyAppointmentsPageClient({
  initialAppointments,
  consultationRooms,
  currentStaffId,
}: MyAppointmentsPageClientProps) {
  const [appointments] = useState<Appointment[]>(initialAppointments);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>(initialAppointments);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [isLoading, setIsLoading] = useState(false);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Calcular estadísticas
  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    upcoming: appointments.filter((a) => {
      const appointmentDate = new Date(a.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return appointmentDate >= today && (a.status === "pending" || a.status === "confirmed");
    }).length,
  };

  // Aplicar filtros
  const applyFilters = (status: string, dateRange: string) => {
    let filtered = [...appointments];

    // Filtro por estado
    if (status !== "all") {
      filtered = filtered.filter((a) => a.status === status);
    }

    // Filtro por fecha
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateRange === "today") {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      filtered = filtered.filter((a) => {
        const appointmentDate = new Date(a.appointmentDate);
        return appointmentDate >= today && appointmentDate < tomorrow;
      });
    } else if (dateRange === "week") {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      filtered = filtered.filter((a) => {
        const appointmentDate = new Date(a.appointmentDate);
        return appointmentDate >= today && appointmentDate < nextWeek;
      });
    } else if (dateRange === "month") {
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      filtered = filtered.filter((a) => {
        const appointmentDate = new Date(a.appointmentDate);
        return appointmentDate >= today && appointmentDate < nextMonth;
      });
    } else if (dateRange === "past") {
      filtered = filtered.filter((a) => {
        const appointmentDate = new Date(a.appointmentDate);
        return appointmentDate < today;
      });
    }

    // Ordenar por fecha (más recientes primero)
    filtered.sort((a, b) => {
      const dateA = new Date(a.appointmentDate).getTime();
      const dateB = new Date(b.appointmentDate).getTime();
      return dateB - dateA;
    });

    setFilteredAppointments(filtered);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    applyFilters(status, dateFilter);
  };

  const handleDateFilterChange = (dateRange: string) => {
    setDateFilter(dateRange);
    applyFilters(statusFilter, dateRange);
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    const appointment = appointments.find((a) => a.id === id);
    if (!appointment) return;

    const confirmed = confirm(
      `¿Estás seguro de cambiar el estado a "${STATUS_LABELS[newStatus] || newStatus}"?`
    );
    if (!confirmed) return;

    setIsLoading(true);

    const appointmentData = {
      id,
      patientId: appointment.patientId,
      staffId: currentStaffId,
      appointmentDate: new Date(appointment.appointmentDate),
      startTime: new Date(appointment.startTime).toTimeString().slice(0, 5),
      endTime: new Date(appointment.endTime).toTimeString().slice(0, 5),
      status: newStatus as "pending" | "confirmed" | "completed" | "cancelled" | "no_show",
      consultationType: appointment.consultationType || undefined,
      notes: appointment.notes || undefined,
      consultationRoomId: appointment.consultationRoomId || undefined,
    };

    const result = await createOrUpdateAppointmentAction(appointmentData);

    if (result.success) {
      // Recargar datos
      window.location.reload();
    } else {
      alert("Error al actualizar el estado: " + result.message);
      setIsLoading(false);
    }
  };

  const handleSave = async (data: FormData) => {
    setIsLoading(true);

    const appointmentData = {
      id: data.get("id") ? Number(data.get("id")) : undefined,
      patientId: Number(data.get("patientId")),
      staffId: currentStaffId,
      appointmentDate: new Date(data.get("appointmentDate") as string),
      startTime: data.get("startTime") as string,
      endTime: data.get("endTime") as string,
      status: data.get("status") as "pending" | "confirmed" | "completed" | "cancelled" | "no_show",
      consultationType: data.get("consultationType") ? (data.get("consultationType") as string) : undefined,
      notes: data.get("notes") ? (data.get("notes") as string) : undefined,
      consultationRoomId: data.get("consultationRoomId") ? Number(data.get("consultationRoomId")) : undefined,
    };

    const result = await createOrUpdateAppointmentAction(appointmentData);

    if (result.success) {
      setIsModalOpen(false);
      window.location.reload();
    } else {
      alert("Error al guardar: " + result.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Mis Citas 📅</h1>
        <p className="text-gray-600 mt-2">Gestiona tus citas programadas con pacientes</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-600">Total de citas</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">📅</div>
          <div className="text-2xl font-bold text-emerald-600">{stats.upcoming}</div>
          <div className="text-sm text-gray-600">Próximas</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">⏳</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pendientes</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
          <div className="text-sm text-gray-600">Confirmadas</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">✔️</div>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Completadas</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por estado:</label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="confirmed">Confirmadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
              <option value="no_show">No asistieron</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por fecha:</label>
            <select
              value={dateFilter}
              onChange={(e) => handleDateFilterChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="week">Próximos 7 días</option>
              <option value="month">Próximos 30 días</option>
              <option value="past">Pasadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Indicador de carga */}
      {isLoading && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
          <p className="text-emerald-700">⏳ Actualizando...</p>
        </div>
      )}

      {/* Tabla de citas */}
      <MyAppointmentsTable
        appointments={filteredAppointments}
        onEdit={handleEdit}
        onUpdateStatus={handleUpdateStatus}
        onViewDetails={handleViewDetails}
      />

      {/* Modal */}
      <MyAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointment={selectedAppointment}
        consultationRooms={consultationRooms}
        onSave={handleSave}
        mode={modalMode}
      />
    </div>
  );
}
