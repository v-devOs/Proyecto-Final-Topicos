"use client";

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

type MyAppointmentsTableProps = {
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
  onUpdateStatus: (id: number, status: string) => void;
  onViewDetails: (appointment: Appointment) => void;
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
    weekday: "long",
    year: "numeric",
    month: "long",
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

const getStatusActions = (status: string) => {
  switch (status) {
    case "pending":
      return ["confirmed", "cancelled"];
    case "confirmed":
      return ["completed", "no_show", "cancelled"];
    default:
      return [];
  }
};

export default function MyAppointmentsTable({
  appointments,
  onEdit,
  onUpdateStatus,
  onViewDetails,
}: MyAppointmentsTableProps) {
  return (
    <div className="space-y-4">
      {appointments.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-gray-500 text-lg">No tienes citas programadas</p>
          <p className="text-gray-400 text-sm mt-2">
            Las citas aparecerán aquí cuando los pacientes las agenden
          </p>
        </div>
      ) : (
        appointments.map((appointment) => {
          const allowedActions = getStatusActions(appointment.status);
          const isPastAppointment = new Date(appointment.appointmentDate) < new Date();

          return (
            <div
              key={appointment.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Información principal */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {formatDate(appointment.appointmentDate)}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_LABELS[appointment.status]?.color || "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {STATUS_LABELS[appointment.status]?.label || appointment.status}
                    </span>
                    {isPastAppointment && appointment.status === "pending" && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                        Vencida
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-lg">🕐</span>
                      <span>
                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👤</span>
                        <span className="font-semibold text-gray-800">
                          {appointment.patient.firstName} {appointment.patient.lastName}
                        </span>
                      </div>
                      <div className="ml-7 text-xs text-gray-500">
                        Control: {appointment.patient.nuControl} • {appointment.patient.email}
                      </div>
                    </div>

                    {appointment.consultationRoom && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-lg">🏢</span>
                        <span>
                          {appointment.consultationRoom.code} - {appointment.consultationRoom.name}
                        </span>
                      </div>
                    )}

                    {appointment.consultationType && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-lg">📋</span>
                        <span>{appointment.consultationType}</span>
                      </div>
                    )}
                  </div>

                  {appointment.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Notas:</strong> {appointment.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-2 md:min-w-[180px]">
                  {/* Cambio rápido de estado */}
                  {allowedActions.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Cambiar estado:</label>
                      <div className="flex flex-wrap gap-1">
                        {allowedActions.map((action) => (
                          <button
                            key={action}
                            onClick={() => onUpdateStatus(appointment.id, action)}
                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${action === "confirmed"
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              : action === "completed"
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : action === "cancelled"
                                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                          >
                            {STATUS_LABELS[action]?.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewDetails(appointment)}
                      className="flex-1 px-3 py-2 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      Ver detalles
                    </button>
                    {appointment.status !== "completed" && appointment.status !== "cancelled" && (
                      <button
                        onClick={() => onEdit(appointment)}
                        className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Editar"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
