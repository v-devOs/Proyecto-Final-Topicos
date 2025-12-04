import { getPaginatedStaff } from "@/app/actions/staff/get-paginated-staff";
import { getPaginatedPatients } from "@/app/actions/patient/get-paginated-patient";
import { getPaginatedConsultationRooms } from "@/app/actions/consultation-room/get-paginated-consultation-room";
import { getTodayAppointments } from "@/app/actions/appointment/get-paginated-appointment";
import prisma from "@/app/lib/prisma";

export default async function AdminDashboard() {
  // Obtener datos reales de la base de datos
  const [staffResult, patientsResult, roomsResult, appointmentsResult] = await Promise.all([
    getPaginatedStaff({ page: 1, pageSize: 100, activeOnly: true }),
    getPaginatedPatients({ page: 1, pageSize: 100, activeOnly: true }),
    getPaginatedConsultationRooms({ page: 1, pageSize: 100, activeOnly: true }),
    getTodayAppointments(), // Sin parámetros para obtener todas las citas de hoy
  ]);

  const totalStaff = staffResult.success && staffResult.data ? staffResult.data.pagination.totalItems : 0;
  const totalPatients = patientsResult.success && patientsResult.data ? patientsResult.data.pagination.totalItems : 0;
  const totalRooms = roomsResult.success && roomsResult.data ? roomsResult.data.pagination.totalItems : 0;
  const todayAppointments = appointmentsResult.success && appointmentsResult.data ? appointmentsResult.data.appointments : [];

  // Contar citas pendientes hoy
  const pendingToday = todayAppointments.filter(apt => apt.status === "pending").length;

  // Obtener las próximas citas (hoy y futuras, confirmadas o pendientes)
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      appointmentDate: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
      status: {
        in: ["pending", "confirmed"],
      },
    },
    include: {
      patient: {
        select: {
          email: true,
        },
      },
      staff: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      consultationRoom: {
        select: {
          code: true,
        },
      },
    },
    orderBy: [
      { appointmentDate: "asc" },
      { startTime: "asc" },
    ],
    take: 5,
  });

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
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalStaff}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👨‍⚕️</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Psicólogos activos registrados
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalPatients}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🧑</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Pacientes activos en el sistema
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Citas Hoy</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{todayAppointments.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            <span className="text-blue-600 font-medium">{pendingToday}</span> pendientes
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Consultorios</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalRooms}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Consultorios activos disponibles
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
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-emerald-700">
                        {apt.patient.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{apt.patient.email}</p>
                      <p className="text-xs text-gray-500">
                        {apt.staff.firstName} {apt.staff.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(apt.startTime).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {apt.consultationRoom?.code || 'Sin asignar'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No hay citas próximas</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen del Sistema</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-3">
                <span className="text-lg">👨‍⚕️</span>
                <span className="text-sm text-gray-700">Psicólogos Activos</span>
              </div>
              <span className="text-sm font-bold text-emerald-600">{totalStaff}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-3">
                <span className="text-lg">🧑</span>
                <span className="text-sm text-gray-700">Pacientes Registrados</span>
              </div>
              <span className="text-sm font-bold text-purple-600">{totalPatients}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-3">
                <span className="text-lg">�</span>
                <span className="text-sm text-gray-700">Citas Hoy</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{todayAppointments.length}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-3">
                <span className="text-lg">⏳</span>
                <span className="text-sm text-gray-700">Citas Pendientes</span>
              </div>
              <span className="text-sm font-bold text-yellow-600">{pendingToday}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">🏢</span>
                <span className="text-sm text-gray-700">Consultorios Disponibles</span>
              </div>
              <span className="text-sm font-bold text-orange-600">{totalRooms}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
