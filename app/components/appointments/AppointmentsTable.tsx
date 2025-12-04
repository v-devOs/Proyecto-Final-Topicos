"use client";

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

type AppointmentsTableProps = {
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: number) => void;
  onUpdateStatus: (id: number, status: string) => void;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmada", color: "bg-blue-100 text-blue-800" },
  completed: { label: "Completada", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelada", color: "bg-red-100 text-red-800" },
  no_show: { label: "No asistió", color: "bg-gray-100 text-gray-800" },
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export default function AppointmentsTable({
  appointments,
  onEdit,
  onDelete,
  onUpdateStatus,
}: AppointmentsTableProps) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Paciente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Psicólogo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Horario
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Consultorio
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {appointments.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                No se encontraron citas
              </td>
            </tr>
          ) : (
            appointments.map((appointment) => (
              <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {appointment.patient.firstName} {appointment.patient.lastName}
                  </div>
                  <div className="text-xs text-gray-500">
                    Control: {appointment.patient.nuControl}
                  </div>
                  <div className="text-xs text-gray-400">{appointment.patient.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {appointment.staff.firstName} {appointment.staff.lastName}
                  </div>
                  <div className="text-xs text-gray-500">{appointment.staff.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(appointment.appointmentDate)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {appointment.consultationRoom ? (
                    <div className="text-sm text-gray-900">
                      {appointment.consultationRoom.code}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Sin asignar</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={appointment.status}
                    onChange={(e) => onUpdateStatus(appointment.id, e.target.value)}
                    className={`px-2 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer ${STATUS_LABELS[appointment.status]?.color || "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => onEdit(appointment)}
                    className="text-emerald-600 hover:text-emerald-900 transition-colors"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  {appointment.status === "cancelled" && (
                    <button
                      onClick={() => onDelete(appointment.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Eliminar permanentemente"
                    >
                      🗑️
                    </button>
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
