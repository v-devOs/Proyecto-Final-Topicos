"use client";

import { useState } from "react";

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
    firstName: string;
    lastName: string;
    nuControl: string;
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

type MyAppointmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  consultationRooms: ConsultationRoom[];
  onSave: (data: FormData) => void;
  mode: "view" | "edit";
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmada" },
  { value: "completed", label: "Completada" },
  { value: "cancelled", label: "Cancelada" },
  { value: "no_show", label: "No asistió" },
];

export default function MyAppointmentModal({
  isOpen,
  onClose,
  appointment,
  consultationRooms,
  onSave,
  mode,
}: MyAppointmentModalProps) {
  const initialFormData = appointment
    ? {
      appointmentDate: new Date(appointment.appointmentDate).toISOString().split("T")[0],
      startTime: new Date(appointment.startTime).toTimeString().slice(0, 5),
      endTime: new Date(appointment.endTime).toTimeString().slice(0, 5),
      status: appointment.status,
      consultationType: appointment.consultationType || "",
      notes: appointment.notes || "",
      consultationRoomId: appointment.consultationRoomId?.toString() || "",
    }
    : {
      appointmentDate: "",
      startTime: "",
      endTime: "",
      status: "pending",
      consultationType: "",
      notes: "",
      consultationRoomId: "",
    };

  const [formData, setFormData] = useState(initialFormData);

  if (!isOpen || !appointment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.endTime <= formData.startTime) {
      alert("La hora de fin debe ser posterior a la hora de inicio");
      return;
    }

    const data = new FormData();
    data.append("id", appointment.id.toString());
    data.append("patientId", appointment.patientId.toString());
    data.append("appointmentDate", formData.appointmentDate);
    data.append("startTime", formData.startTime);
    data.append("endTime", formData.endTime);
    data.append("status", formData.status);
    if (formData.consultationType) data.append("consultationType", formData.consultationType);
    if (formData.notes) data.append("notes", formData.notes);
    if (formData.consultationRoomId) data.append("consultationRoomId", formData.consultationRoomId);

    onSave(data);
  };

  const isViewMode = mode === "view";
  const canEdit = appointment.status !== "completed" && appointment.status !== "cancelled";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {isViewMode ? "Detalles de la Cita" : "Editar Cita"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información del paciente (solo lectura) */}
          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
            <h3 className="text-sm font-semibold text-emerald-800 mb-3">
              👤 Información del Paciente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-emerald-700">
              <div>
                <strong>Nombre completo:</strong>
                <div className="text-emerald-900 font-medium">
                  {appointment.patient.firstName} {appointment.patient.lastName}
                </div>
              </div>
              <div>
                <strong>No. Control:</strong>
                <div className="text-emerald-900 font-medium">
                  {appointment.patient.nuControl}
                </div>
              </div>
              <div className="md:col-span-2">
                <strong>Email:</strong>
                <div className="text-emerald-900">
                  {appointment.patient.email}
                </div>
              </div>
            </div>
          </div>

          {/* Fecha y hora */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                disabled={isViewMode}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                disabled={isViewMode}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora fin <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                disabled={isViewMode}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Estado y tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={isViewMode}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de consulta
              </label>
              <input
                type="text"
                value={formData.consultationType}
                onChange={(e) => setFormData({ ...formData, consultationType: e.target.value })}
                disabled={isViewMode}
                placeholder="Ej: Primera consulta, Seguimiento..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Consultorio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Consultorio</label>
            <select
              value={formData.consultationRoomId}
              onChange={(e) => setFormData({ ...formData, consultationRoomId: e.target.value })}
              disabled={isViewMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Sin asignar</option>
              {consultationRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.code} - {room.name} ({room.location})
                </option>
              ))}
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={isViewMode}
              rows={4}
              placeholder="Notas adicionales sobre la cita..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
            />
          </div>

          {!isViewMode && !canEdit && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Esta cita está {appointment.status === "completed" ? "completada" : "cancelada"}{" "}
                y no se puede editar.
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {isViewMode ? "Cerrar" : "Cancelar"}
            </button>
            {!isViewMode && canEdit && (
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Guardar cambios
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
