export default function StaffDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Bienvenido a tu panel de psicólogo
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mis Pacientes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">28</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🧑</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            <span className="text-purple-600 font-medium">5</span> activos
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Citas Hoy</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">8</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            <span className="text-blue-600 font-medium">3</span> completadas
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Esta Semana</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">32</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            <span className="text-green-600 font-medium">+5</span> vs anterior
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mi Consultorio</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">C-3</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            <span className="text-yellow-600 font-medium">Disponible</span>
          </p>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Mi Agenda de Hoy</h2>
          <span className="text-sm text-gray-500">Martes, 3 de Diciembre 2025</span>
        </div>
        <div className="space-y-3">
          {[
            { time: "09:00", patient: "María García", type: "Primera consulta", status: "completed" },
            { time: "10:00", patient: "Juan Pérez", type: "Seguimiento", status: "completed" },
            { time: "11:00", patient: "Ana López", type: "Terapia", status: "completed" },
            { time: "12:00", patient: "--- Almuerzo ---", type: "", status: "break" },
            { time: "14:00", patient: "Carlos Ramírez", type: "Primera consulta", status: "confirmed" },
            { time: "15:00", patient: "Laura Martínez", type: "Seguimiento", status: "confirmed" },
            { time: "16:00", patient: "Pedro Sánchez", type: "Terapia", status: "pending" },
            { time: "17:00", patient: "Sofia Torres", type: "Primera consulta", status: "pending" },
          ].map((appointment, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${appointment.status === "completed"
                  ? "bg-green-50 border-green-500"
                  : appointment.status === "confirmed"
                    ? "bg-blue-50 border-blue-500"
                    : appointment.status === "break"
                      ? "bg-gray-50 border-gray-300"
                      : "bg-yellow-50 border-yellow-500"
                }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{appointment.time}</p>
                  {appointment.status === "completed" && (
                    <span className="text-xs text-green-600">✓</span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{appointment.patient}</p>
                  {appointment.type && (
                    <p className="text-sm text-gray-600">{appointment.type}</p>
                  )}
                </div>
              </div>
              {appointment.status !== "break" && (
                <div className="flex gap-2">
                  {appointment.status === "pending" && (
                    <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                      Confirmar
                    </button>
                  )}
                  {appointment.status !== "completed" && (
                    <button className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">
                      Ver Detalles
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pacientes Recientes</h2>
          <div className="space-y-3">
            {[
              { name: "María García", lastVisit: "Hoy, 09:00", status: "Activo" },
              { name: "Juan Pérez", lastVisit: "Hoy, 10:00", status: "Activo" },
              { name: "Ana López", lastVisit: "Hoy, 11:00", status: "Activo" },
              { name: "Carlos Ramírez", lastVisit: "Ayer, 15:00", status: "Activo" },
              { name: "Laura Martínez", lastVisit: "2 días atrás", status: "Activo" },
            ].map((patient, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-700">
                      {patient.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                    <p className="text-xs text-gray-500">{patient.lastVisit}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  {patient.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Próximas Citas</h2>
          <div className="space-y-3">
            {[
              { date: "Hoy", time: "14:00", patient: "Carlos Ramírez" },
              { date: "Hoy", time: "15:00", patient: "Laura Martínez" },
              { date: "Hoy", time: "16:00", patient: "Pedro Sánchez" },
              { date: "Mañana", time: "09:00", patient: "Roberto Gil" },
              { date: "Mañana", time: "10:00", patient: "Daniela Cruz" },
            ].map((appointment, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{appointment.patient}</p>
                  <p className="text-xs text-gray-500">{appointment.date} a las {appointment.time}</p>
                </div>
                <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  Ver
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
