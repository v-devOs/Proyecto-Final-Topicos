"use client";

import { useState, useEffect } from "react";
import { createOrUpdateScheduleAction } from "@/app/actions/schedule/create-update-schedule";

type Schedule = {
  id: number;
  staffId: number;
  dayOfWeek: number;
  startTime: Date;
  endTime: Date;
  available: boolean;
};

type MyScheduleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schedule?: Schedule | null;
  currentStaffId: number;
};

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

const formatTimeForInput = (date: Date) => {
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

export default function MyScheduleModal({
  isOpen,
  onClose,
  onSuccess,
  schedule,
  currentStaffId,
}: MyScheduleModalProps) {
  const [formData, setFormData] = useState({
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "17:00",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInitialFormData = () => ({
    dayOfWeek: schedule?.dayOfWeek || 1,
    startTime: schedule?.startTime ? formatTimeForInput(schedule.startTime) : "09:00",
    endTime: schedule?.endTime ? formatTimeForInput(schedule.endTime) : "17:00",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, schedule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
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
      staffId: number;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      available: boolean;
      id?: number;
    } = {
      staffId: currentStaffId,
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
      available: true,
    };

    if (schedule) {
      dataToSend.id = schedule.id;
    }

    const result = await createOrUpdateScheduleAction(dataToSend);
    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.message || "Error al guardar el horario");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {schedule ? "Editar Horario" : "Agregar Horario"}
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
            {/* Día de la Semana */}
            <div>
              <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700 mb-1">
                Día de la Semana *
              </label>
              <select
                id="dayOfWeek"
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
                disabled={isSubmitting}
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Este horario se agregará a tu disponibilidad semanal.
                Los pacientes podrán agendar citas durante estos horarios.
              </p>
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
              {isSubmitting ? "Guardando..." : schedule ? "Actualizar" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
