"use client";

import { useState } from "react";
import MySchedulesTable from "./MySchedulesTable";
import MyScheduleModal from "./MyScheduleModal";
import { getPaginatedSchedules } from "@/app/actions/schedule/get-paginated-schedule";
import { deleteScheduleAction } from "@/app/actions/schedule/delete-schedule";
import { createOrUpdateScheduleAction } from "@/app/actions/schedule/create-update-schedule";

type Schedule = {
  id: number;
  staffId: number;
  dayOfWeek: number;
  startTime: Date;
  endTime: Date;
  available: boolean;
};

type MySchedulesPageClientProps = {
  initialSchedules: Schedule[];
  currentStaffId: number;
};

const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function MySchedulesPageClient({
  initialSchedules,
  currentStaffId,
}: MySchedulesPageClientProps) {
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [selectedDay, setSelectedDay] = useState<number | undefined>();
  const [availableOnly, setAvailableOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  const loadSchedules = async () => {
    setIsLoading(true);
    const result = await getPaginatedSchedules({
      staffId: currentStaffId,
      dayOfWeek: selectedDay,
      availableOnly,
      page: 1,
      pageSize: 100, // Cargar todos los horarios del staff
    });

    if (result.success && result.data) {
      setSchedules(result.data.schedules.map(s => ({
        id: s.id,
        staffId: s.staffId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        available: s.available,
      })));
    }
    setIsLoading(false);
  };

  const handleCreate = () => {
    setSelectedSchedule(null);
    setIsModalOpen(true);
  };

  const handleEdit = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSchedule(null);
  };

  const handleSuccess = () => {
    loadSchedules();
  };

  const handleToggleAvailable = async (id: number, currentStatus: boolean) => {
    const confirmed = window.confirm(
      currentStatus
        ? "¿Marcar este horario como no disponible?"
        : "¿Marcar este horario como disponible?"
    );

    if (!confirmed) return;

    setIsLoading(true);
    const scheduleToUpdate = schedules.find((s) => s.id === id);
    if (scheduleToUpdate) {
      const result = await createOrUpdateScheduleAction({
        id,
        staffId: scheduleToUpdate.staffId,
        dayOfWeek: scheduleToUpdate.dayOfWeek,
        startTime: new Date(scheduleToUpdate.startTime).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        endTime: new Date(scheduleToUpdate.endTime).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        available: !currentStatus,
      });

      if (result.success) {
        loadSchedules();
      } else {
        alert(result.message || "Error al actualizar el horario");
        setIsLoading(false);
      }
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "¿Estás seguro de eliminar permanentemente este horario? Esta acción no se puede deshacer."
    );

    if (!confirmed) return;

    setIsLoading(true);
    const result = await deleteScheduleAction(id);

    if (result.success) {
      loadSchedules();
    } else {
      alert(result.message || "Error al eliminar el horario");
      setIsLoading(false);
    }
  };

  // Agrupar horarios por día
  const schedulesByDay = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.dayOfWeek]) {
      acc[schedule.dayOfWeek] = [];
    }
    acc[schedule.dayOfWeek].push(schedule);
    return acc;
  }, {} as Record<number, Schedule[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Mis Horarios</h1>
          <p className="text-gray-600 mt-1">Gestiona tu disponibilidad semanal</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          Agregar Horario
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Horarios</p>
              <p className="text-2xl font-bold text-gray-800">{schedules.length}</p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Disponibles</p>
              <p className="text-2xl font-bold text-green-600">
                {schedules.filter((s) => s.available).length}
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Días con horarios</p>
              <p className="text-2xl font-bold text-emerald-600">
                {Object.keys(schedulesByDay).length}
              </p>
            </div>
            <div className="text-4xl">📆</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por día
            </label>
            <select
              value={selectedDay ?? ""}
              onChange={(e) => setSelectedDay(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Todos los días</option>
              {DAYS_OF_WEEK.map((day, index) => (
                <option key={index} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={loadSchedules}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors self-end"
            disabled={isLoading}
          >
            {isLoading ? "Buscando..." : "Filtrar"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="availableOnly"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="availableOnly" className="text-sm text-gray-700">
            Mostrar solo horarios disponibles
          </label>
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-500">Cargando horarios...</p>
        </div>
      ) : (
        <MySchedulesTable
          schedules={schedules}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleAvailable={handleToggleAvailable}
        />
      )}

      {/* Modal */}
      <MyScheduleModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        schedule={selectedSchedule}
        currentStaffId={currentStaffId}
      />
    </div>
  );
}
