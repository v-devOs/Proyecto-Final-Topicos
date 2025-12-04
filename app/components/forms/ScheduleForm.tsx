"use client";

import { useState, useEffect } from "react";
import { createOrUpdateScheduleAction } from "@/app/actions/schedule/create-update-schedule";
import { getPaginatedStaff } from "@/app/actions/staff/get-paginated-staff";

interface ScheduleFormProps {
  schedule?: {
    id: number;
    staffId: number;
    dayOfWeek: number;
    startTime: Date;
    endTime: Date;
    available: boolean;
  };
  staffId?: number; // Pre-seleccionar staff
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ScheduleForm({
  schedule,
  staffId: preselectedStaffId,
  onSuccess,
  onCancel,
}: ScheduleFormProps) {
  const [formData, setFormData] = useState({
    staffId: schedule?.staffId?.toString() || preselectedStaffId?.toString() || "",
    dayOfWeek: schedule?.dayOfWeek?.toString() || "1",
    startTime: schedule?.startTime
      ? new Date(schedule.startTime).toTimeString().slice(0, 5)
      : "09:00",
    endTime: schedule?.endTime
      ? new Date(schedule.endTime).toTimeString().slice(0, 5)
      : "17:00",
    available: schedule?.available ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffList, setStaffList] = useState<
    Array<{ id: number; firstName: string; lastName: string }>
  >([]);

  const isEditing = !!schedule;

  const daysOfWeek = [
    { value: "0", label: "Domingo" },
    { value: "1", label: "Lunes" },
    { value: "2", label: "Martes" },
    { value: "3", label: "Miércoles" },
    { value: "4", label: "Jueves" },
    { value: "5", label: "Viernes" },
    { value: "6", label: "Sábado" },
  ];

  // Cargar lista de psicólogos activos
  useEffect(() => {
    const loadStaff = async () => {
      setLoadingStaff(true);
      try {
        const result = await getPaginatedStaff({
          page: 1,
          pageSize: 100,
          activeOnly: true,
        });

        if (result.success && result.data) {
          setStaffList(result.data.staff);
        }
      } catch (err) {
        console.error("Error al cargar psicólogos:", err);
      } finally {
        setLoadingStaff(false);
      }
    };

    loadStaff();
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
      const result = await createOrUpdateScheduleAction({
        ...(schedule?.id && { id: schedule.id }),
        staffId: parseInt(formData.staffId),
        dayOfWeek: parseInt(formData.dayOfWeek),
        startTime: formData.startTime, // Ya está en formato HH:MM
        endTime: formData.endTime, // Ya está en formato HH:MM
        available: formData.available,
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Título */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? "Editar Horario" : "Nuevo Horario"}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {isEditing
            ? "Actualiza el horario del psicólogo"
            : "Define el horario de disponibilidad del psicólogo"}
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
        {/* Psicólogo */}
        <div className="md:col-span-2">
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
            disabled={loadingStaff}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors disabled:bg-gray-100"
          >
            <option value="">Seleccionar psicólogo</option>
            {staffList.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.firstName} {staff.lastName}
              </option>
            ))}
          </select>
          {loadingStaff && (
            <p className="mt-1 text-xs text-gray-500">
              Cargando psicólogos...
            </p>
          )}
        </div>

        {/* Día de la Semana */}
        <div>
          <label
            htmlFor="dayOfWeek"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Día de la Semana <span className="text-red-500">*</span>
          </label>
          <select
            id="dayOfWeek"
            name="dayOfWeek"
            value={formData.dayOfWeek}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
          >
            {daysOfWeek.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
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

        {/* Disponible */}
        <div className="md:col-span-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="available"
              name="available"
              checked={formData.available}
              onChange={handleChange}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
            />
            <label htmlFor="available" className="ml-2 text-sm text-gray-700">
              Horario disponible para citas
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Los horarios no disponibles no se mostrarán al agendar citas
          </p>
        </div>
      </div>

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
          disabled={loading}
          className="flex-1 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Procesando..." : isEditing ? "Actualizar" : "Crear Horario"}
        </button>
      </div>
    </form>
  );
}
