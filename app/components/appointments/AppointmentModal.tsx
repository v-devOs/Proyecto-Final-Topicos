"use client";

import { useState, useEffect } from "react";
import { createOrUpdateAppointmentAction } from "@/app/actions/appointment/create-update-appointment";
import { getPaginatedStaff } from "@/app/actions/staff/get-paginated-staff";
import { getPaginatedConsultationRooms } from "@/app/actions/consultation-room/get-paginated-consultation-room";

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
};

type Staff = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

type ConsultationRoom = {
  id: number;
  code: string;
  name: string;
};

type AppointmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment?: Appointment | null;
};

const formatDateForInput = (date: Date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

const formatTimeForInput = (date: Date) => {
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

export default function AppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  appointment,
}: AppointmentModalProps) {
  const [formData, setFormData] = useState({
    patientId: 0,
    staffId: 0,
    appointmentDate: "",
    startTime: "09:00",
    endTime: "10:00",
    status: "pending" as "pending" | "confirmed" | "completed" | "cancelled" | "no_show",
    consultationType: "",
    notes: "",
    consultationRoomId: null as number | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [roomsList, setRoomsList] = useState<ConsultationRoom[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Cargar lista de staff y consultorios
  useEffect(() => {
    if (isOpen) {
      loadSelectData();
    }
  }, [isOpen]);

  const loadSelectData = async () => {
    setLoadingData(true);
    const [staffResult, roomsResult] = await Promise.all([
      getPaginatedStaff({ page: 1, pageSize: 100, activeOnly: true }),
      getPaginatedConsultationRooms({ page: 1, pageSize: 100, activeOnly: true }),
    ]);

    if (staffResult.success && staffResult.data) {
      setStaffList(
        staffResult.data.staff.map((s) => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          email: s.email,
        }))
      );
    }

    if (roomsResult.success && roomsResult.data) {
      setRoomsList(
        roomsResult.data.consultationRooms.map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
        }))
      );
    }

    setLoadingData(false);
  };

  const getInitialFormData = () => ({
    patientId: appointment?.patientId || 0,
    staffId: appointment?.staffId || 0,
    appointmentDate: appointment?.appointmentDate
      ? formatDateForInput(appointment.appointmentDate)
      : "",
    startTime: appointment?.startTime ? formatTimeForInput(appointment.startTime) : "09:00",
    endTime: appointment?.endTime ? formatTimeForInput(appointment.endTime) : "10:00",
    status: (appointment?.status as typeof formData.status) || "pending",
    consultationType: appointment?.consultationType || "",
    notes: appointment?.notes || "",
    consultationRoomId: appointment?.consultationRoomId || null,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, appointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (formData.patientId === 0) {
      setError("Debes proporcionar un ID de paciente válido");
      return;
    }

    if (formData.staffId === 0) {
      setError("Debes seleccionar un psicólogo");
      return;
    }

    if (!formData.appointmentDate) {
      setError("La fecha de la cita es obligatoria");
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      setError("Las horas de inicio y fin son obligatorias");
      return;
    }

    // Validar que la hora de fin sea mayor que la hora de inicio
    const [startHour, startMin] = formData.startTime.split(":").map(Number);
    const [endHour, endMin] = formData.endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      setError("La hora de fin debe ser posterior a la hora de inicio");
      return;
    }

    setIsSubmitting(true);

    const dataToSend: {
      patientId: number;
      staffId: number;
      appointmentDate: Date;
      startTime: string;
      endTime: string;
      status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
      consultationType: string | null;
      notes: string | null;
      consultationRoomId: number | null;
      id?: number;
    } = {
      patientId: formData.patientId,
      staffId: formData.staffId,
      appointmentDate: new Date(formData.appointmentDate),
      startTime: formData.startTime,
      endTime: formData.endTime,
      status: formData.status,
      consultationType: formData.consultationType.trim() || null,
      notes: formData.notes.trim() || null,
      consultationRoomId: formData.consultationRoomId,
    };

    if (appointment) {
      dataToSend.id = appointment.id;
    }

    const result = await createOrUpdateAppointmentAction(dataToSend);
    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.message || "Error al guardar la cita");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {appointment ? "Editar Cita" : "Nueva Cita"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* ID del Paciente */}
            <div>
              <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">
                ID del Paciente *
              </label>
              <input
                type="number"
                id="patientId"
                min="1"
                value={formData.patientId || ""}
                onChange={(e) =>
                  setFormData({ ...formData, patientId: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
                disabled={isSubmitting}
                placeholder="Ingresa el ID del paciente"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ingresa el ID numérico del paciente registrado
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Psicólogo */}
              <div>
                <label htmlFor="staffId" className="block text-sm font-medium text-gray-700 mb-1">
                  Psicólogo *
                </label>
                <select
                  id="staffId"
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  disabled={isSubmitting || loadingData}
                >
                  <option value="0">Seleccionar psicólogo</option>
                  {loadingData ? (
                    <option disabled>Cargando...</option>
                  ) : (
                    staffList.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.firstName} {staff.lastName}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label
                  htmlFor="appointmentDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fecha de la Cita *
                </label>
                <input
                  type="date"
                  id="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hora Inicio */}
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Hora de Inicio *
                </label>
                <input
                  type="time"
                  id="startTime"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Hora Fin */}
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Hora de Fin *
                </label>
                <input
                  type="time"
                  id="endTime"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estado */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Estado *
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as typeof formData.status,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  disabled={isSubmitting}
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                  <option value="no_show">No asistió</option>
                </select>
              </div>

              {/* Consultorio */}
              <div>
                <label
                  htmlFor="consultationRoomId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Consultorio
                </label>
                <select
                  id="consultationRoomId"
                  value={formData.consultationRoomId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      consultationRoomId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={isSubmitting || loadingData}
                >
                  <option value="">Sin asignar</option>
                  {loadingData ? (
                    <option disabled>Cargando...</option>
                  ) : (
                    roomsList.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.code} - {room.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Tipo de Consulta */}
            <div>
              <label
                htmlFor="consultationType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tipo de Consulta
              </label>
              <input
                type="text"
                id="consultationType"
                value={formData.consultationType}
                onChange={(e) => setFormData({ ...formData, consultationType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ej: Terapia individual, Evaluación inicial, etc."
                disabled={isSubmitting}
                maxLength={50}
              />
            </div>

            {/* Notas */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Notas adicionales sobre la cita..."
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : appointment ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
