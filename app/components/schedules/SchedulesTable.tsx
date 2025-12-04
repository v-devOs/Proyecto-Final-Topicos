"use client";

type Schedule = {
  id: number;
  staffId: number;
  dayOfWeek: number;
  startTime: Date;
  endTime: Date;
  available: boolean;
  staff: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    consultationRoom: {
      code: string;
      name: string;
      location: string;
    } | null;
  };
};

type SchedulesTableProps = {
  schedules: Schedule[];
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: number) => void;
  onToggleAvailable: (id: number, currentStatus: boolean) => void;
};

const DAYS_OF_WEEK = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export default function SchedulesTable({
  schedules,
  onEdit,
  onDelete,
  onToggleAvailable,
}: SchedulesTableProps) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Psicólogo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Día de la Semana
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hora Inicio
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hora Fin
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Consultorio
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Disponibilidad
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {schedules.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                No se encontraron horarios
              </td>
            </tr>
          ) : (
            schedules.map((schedule) => (
              <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {schedule.staff.firstName} {schedule.staff.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{schedule.staff.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                    {DAYS_OF_WEEK[schedule.dayOfWeek]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatTime(schedule.startTime)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatTime(schedule.endTime)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {schedule.staff.consultationRoom ? (
                    <div className="text-sm text-gray-900">
                      {schedule.staff.consultationRoom.code} - {schedule.staff.consultationRoom.name}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Sin asignar</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${schedule.available
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                      }`}
                  >
                    {schedule.available ? "Disponible" : "No disponible"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => onEdit(schedule)}
                    className="text-emerald-600 hover:text-emerald-900 transition-colors"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  {schedule.available ? (
                    <button
                      onClick={() => onToggleAvailable(schedule.id, schedule.available)}
                      className="text-orange-600 hover:text-orange-900 transition-colors"
                      title="Marcar como no disponible"
                    >
                      🔒
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onToggleAvailable(schedule.id, schedule.available)}
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="Marcar como disponible"
                      >
                        🔓
                      </button>
                      <button
                        onClick={() => onDelete(schedule.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Eliminar permanentemente"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
