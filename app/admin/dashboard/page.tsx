export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard de Administración</h1>
        <p className="mt-2 text-gray-600">
          Bienvenido al panel de administración de la clínica
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Psicólogos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👨‍⚕️</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            <span className="text-green-600 font-medium">+2</span> este mes
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">156</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🧑</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            <span className="text-green-600 font-medium">+18</span> este mes
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Citas Hoy</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            <span className="text-blue-600 font-medium">8</span> pendientes
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Consultorios</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">8</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            <span className="text-green-600 font-medium">6</span> disponibles
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center gap-3 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
            <span className="text-2xl">👤</span>
            <span className="text-sm font-medium text-gray-700">Nuevo Admin</span>
          </button>
          <button className="flex items-center gap-3 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
            <span className="text-2xl">👨‍⚕️</span>
            <span className="text-sm font-medium text-gray-700">Nuevo Psicólogo</span>
          </button>
          <button className="flex items-center gap-3 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
            <span className="text-2xl">🧑</span>
            <span className="text-sm font-medium text-gray-700">Nuevo Paciente</span>
          </button>
          <button className="flex items-center gap-3 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
            <span className="text-2xl">📋</span>
            <span className="text-sm font-medium text-gray-700">Nueva Cita</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Próximas Citas</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-700">P{i}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Paciente {i}</p>
                    <p className="text-xs text-gray-500">Dr. González</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{9 + i}:00</p>
                  <p className="text-xs text-gray-500">Consultorio {i}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Actividad Reciente</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 py-3 border-b">
              <span className="text-lg">✅</span>
              <div>
                <p className="text-sm text-gray-900">Nuevo paciente registrado</p>
                <p className="text-xs text-gray-500">Hace 5 minutos</p>
              </div>
            </div>
            <div className="flex items-start gap-3 py-3 border-b">
              <span className="text-lg">📋</span>
              <div>
                <p className="text-sm text-gray-900">Cita confirmada para mañana</p>
                <p className="text-xs text-gray-500">Hace 15 minutos</p>
              </div>
            </div>
            <div className="flex items-start gap-3 py-3 border-b">
              <span className="text-lg">👨‍⚕️</span>
              <div>
                <p className="text-sm text-gray-900">Psicólogo actualizó su horario</p>
                <p className="text-xs text-gray-500">Hace 1 hora</p>
              </div>
            </div>
            <div className="flex items-start gap-3 py-3 border-b">
              <span className="text-lg">🏢</span>
              <div>
                <p className="text-sm text-gray-900">Consultorio 3 liberado</p>
                <p className="text-xs text-gray-500">Hace 2 horas</p>
              </div>
            </div>
            <div className="flex items-start gap-3 py-3">
              <span className="text-lg">❌</span>
              <div>
                <p className="text-sm text-gray-900">Cita cancelada</p>
                <p className="text-xs text-gray-500">Hace 3 horas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
