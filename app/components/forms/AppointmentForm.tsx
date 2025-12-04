"use client";

import { useState, useEffect } from "react";
import { createOrUpdateAppointmentAction } from "@/app/actions/appointment/create-update-appointment";
import { getPaginatedPatients } from "@/app/actions/patient/get-paginated-patient";
import { getPaginatedStaff } from "@/app/actions/staff/get-paginated-staff";
import { getPaginatedConsultationRooms } from "@/app/actions/consultation-room/get-paginated-consultation-room";

interface AppointmentFormProps {
  appointment?: {
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
  patientId?: number; // Pre-seleccionar paciente
  staffId?: number; // Pre-seleccionar staff
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AppointmentForm({
  appointment,
  patientId: preselectedPatientId,
  staffId: preselectedStaffId,
  onSuccess,
  onCancel,
}: AppointmentFormProps) {
  const [formData, setFormData] = useState({
    patientId: appointment?.patientId?.toString() || preselectedPatientId?.toString() || "",
    staffId: appointment?.staffId?.toString() || preselectedStaffId?.toString() || "",
    appointmentDate: appointment?.appointmentDate
      ? new Date(appointment.appointmentDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    startTime: appointment?.startTime
      ? new Date(appointment.startTime).toTimeString().slice(0, 5)
      : "09:00",
    endTime: appointment?.endTime
      ? new Date(appointment.endTime).toTimeString().slice(0, 5)
      : "10:00",
    status: appointment?.status || "pending",
    consultationType: appointment?.consultationType || "",
    notes: appointment?.notes || "",
    consultationRoomId: appointment?.consultationRoomId?.toString() || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [patientsList, setPatientsList] = useState<
    Array<{ id: number; email: string }>
  >([]);
  const [staffList, setStaffList] = useState<
    Array<{ id: number; firstName: string; lastName: string }>
  >([]);
  const [roomsList, setRoomsList] = useState<
    Array<{ id: number; code: string; name: string }>
  >([]);

  const isEditing = !!appointment;

  const statusOptions = [
    { value: "pending", label: "Pendiente" },
    { value: "confirmed", label: "Confirmada" },
    { value: "completed", label: "Completada" },
    { value: "cancelled", label: "Cancelada" },
    { value: "no_show", label: "No se presentó" },
  ];

  // Cargar datos (pacientes, staff, consultorios)
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [patientsResult, staffResult, roomsResult] = await Promise.all([
          getPaginatedPatients({ page: 1, pageSize: 100, activeOnly: true }),
          getPaginatedStaff({ page: 1, pageSize: 100, activeOnly: true }),
          getPaginatedConsultationRooms({ page: 1, pageSize: 100, activeOnly: true }),
        ]);

        if (patientsResult.success && patientsResult.data) {
          setPatientsList(patientsResult.data.patients);
        }

        if (staffResult.success && staffResult.data) {
          setStaffList(staffResult.data.staff);
        }

        if (roomsResult.success && roomsResult.data) {
          setRoomsList(roomsResult.data.consultationRooms);
        }
      } catch (err) {
        console.error("Error al cargar datos:", err);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validación: hora fin debe ser mayor que hora inicio
    if (formData.startTime >= formData.endTime) {
      setError("La hora de fin debe ser posterior a la hora de inicio");
      return;
    }

    setLoading(true);

    try {
      const result = await createOrUpdateAppointmentAction({
        ...(appointment?.id && { id: appointment.id }),
        patientId: parseInt(formData.patientId),
        staffId: parseInt(formData.staffId),
        appointmentDate: new Date(formData.appointmentDate),
        startTime: formData.startTime, // String en formato HH:MM
        endTime: formData.endTime, // String en formato HH:MM
        status: formData.status as "pending" | "confirmed" | "completed" | "cancelled" | "no_show",
        consultationType: formData.consultationType || null,
        notes: formData.notes || null,
        consultationRoomId: formData.consultationRoomId
          ? parseInt(formData.consultationRoomId)
          : null,
      });

      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Error al procesar la solicitud");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Título */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? "Editar Cita" : "Nueva Cita"}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {isEditing
            ? "Actualiza la información de la cita"
            : "Agenda una nueva cita para el paciente"}
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Campos del formulario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Paciente */}
        <div>
          <label
            htmlFor="patientId"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Paciente <span className="text-red-500">*</span>
          </label>
          <select
            id="patientId"
            name="patientId"
            value={formData.patientId}
            onChange={handleChange}
            required
            disabled={loadingData}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors disabled:bg-gray-100"
          >
            <option value="">Seleccionar paciente</option>
            {patientsList.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.email}
              </option>
            ))}
          </select>
        </div>

        {/* Psicólogo */}
        <div>
          <label
            htmlFor="staffId"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Psicólogo <span className="text-red-500">*</span>
          </label>
          <select
            id="staffId"
            name="staffId"
            value={formData.staffId}
            onChange={handleChange}
            required
            disabled={loadingData}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors disabled:bg-gray-100"
          >
            <option value="">Seleccionar psicólogo</option>
            {staffList.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.firstName} {staff.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha de Cita */}
        <div>
          <label
            htmlFor="appointmentDate"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Fecha de Cita <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="appointmentDate"
            name="appointmentDate"
            value={formData.appointmentDate}
            onChange={handleChange}
            required
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
          />
        </div>

        {/* Estado */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Estado <span className="text-red-500">*</span>
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Hora Inicio */}
        <div>
          <label
            htmlFor="startTime"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Hora de Inicio <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
          />
        </div>

        {/* Hora Fin */}
        <div>
          <label
            htmlFor="endTime"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Hora de Fin <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
          />
        </div>

        {/* Tipo de Consulta */}
        <div>
          <label
            htmlFor="consultationType"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Tipo de Consulta
          </label>
          <input
            type="text"
            id="consultationType"
            name="consultationType"
            value={formData.consultationType}
            onChange={handleChange}
            maxLength={50}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
            placeholder="Ej: Primera consulta, Seguimiento"
          />
        </div>

        {/* Consultorio */}
        <div>
          <label
            htmlFor="consultationRoomId"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Consultorio
          </label>
          <select
            id="consultationRoomId"
            name="consultationRoomId"
            value={formData.consultationRoomId}
            onChange={handleChange}
            disabled={loadingData}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors disabled:bg-gray-100"
          >
            <option value="">Sin asignar</option>
            {roomsList.map((room) => (
              <option key={room.id} value={room.id}>
                {room.code} - {room.name}
              </option>
            ))}
          </select>
        </div>

        {/* Notas */}
        <div className="md:col-span-2">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Notas
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors resize-none"
            placeholder="Observaciones o notas adicionales sobre la cita..."
          />
        </div>
      </div>

      {/* Información de carga */}
      {loadingData && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">Cargando datos disponibles...</p>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading || loadingData}
          className="flex-1 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Procesando..." : isEditing ? "Actualizar" : "Agendar Cita"}
        </button>
      </div>
    </form>
  );
}
