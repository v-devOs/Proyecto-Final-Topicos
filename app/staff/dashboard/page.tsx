import { cookies } from "next/headers";
import { verifyToken } from "@/app/actions/auth/auth";
import { redirect } from "next/navigation";
import { getTodayAppointments, getUpcomingStaffAppointments } from "@/app/actions/appointment/get-paginated-appointment";
import { getPaginatedPatients } from "@/app/actions/patient/get-paginated-patient";
import prisma from "@/app/lib/prisma";

export default async function StaffDashboard() {
  // Obtener el staffId del token
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/");
  }

  const verification = await verifyToken(token);
  if (!verification.success || !verification.user?.userId) {
    redirect("/");
  }

  const staffId = verification.user.userId;

  // Obtener datos del staff
  const staffData = await prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  if (!staffData) {
    redirect("/");
  }

  // Obtener datos reales de la base de datos
  const [todayAppointmentsResult, upcomingAppointmentsResult, myPatientsResult] = await Promise.all([
    getTodayAppointments(staffId),
    getUpcomingStaffAppointments(staffId, 5),
    getPaginatedPatients({ page: 1, pageSize: 100, assignedPsychologist: staffId, activeOnly: true }),
  ]);

  const todayAppointments = todayAppointmentsResult.success && todayAppointmentsResult.data ? todayAppointmentsResult.data.appointments : [];
  const upcomingAppointments = upcomingAppointmentsResult.success && upcomingAppointmentsResult.data ? upcomingAppointmentsResult.data.appointments : [];
  const totalPatients = myPatientsResult.success && myPatientsResult.data ? myPatientsResult.data.pagination.totalItems : 0;

  // Filtrar citas completadas hoy
  const completedToday = todayAppointments.filter(apt => apt.status === "completed").length;

  // Obtener citas de esta semana
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const weekAppointments = await prisma.appointment.count({
    where: {
      staffId,
      appointmentDate: {
        gte: startOfWeek,
        lt: endOfWeek,
      },
    },
  });

  // Obtener consultorio asignado más frecuente
  const mostUsedRoom = await prisma.appointment.groupBy({
    by: ['consultationRoomId'],
    where: {
      staffId,
      consultationRoomId: { not: null },
    },
    _count: {
      consultationRoomId: true,
    },
    orderBy: {
      _count: {
        consultationRoomId: 'desc',
      },
    },
    take: 1,
  });

  let roomInfo = null;
  if (mostUsedRoom.length > 0 && mostUsedRoom[0].consultationRoomId) {
    roomInfo = await prisma.consultationRoom.findUnique({
      where: { id: mostUsedRoom[0].consultationRoomId },
      select: { code: true, name: true },
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Bienvenido, {staffData.firstName} {staffData.lastName}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mis Pacientes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalPatients}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🧑</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Pacientes asignados activos
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
            <span className="text-blue-600 font-medium">{completedToday}</span> completadas
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Esta Semana</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{weekAppointments}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Citas programadas esta semana
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mi Consultorio</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {roomInfo ? roomInfo.code : 'N/A'}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            {roomInfo ? roomInfo.name : 'Sin asignar'}
          </p>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Mi Agenda de Hoy</h2>
          <span className="text-sm text-gray-500">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
        <div className="space-y-3">
          {todayAppointments.length > 0 ? (
            todayAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${appointment.status === "completed"
                  ? "bg-green-50 border-green-500"
                  : appointment.status === "confirmed"
                    ? "bg-blue-50 border-blue-500"
                    : appointment.status === "cancelled"
                      ? "bg-red-50 border-red-500"
                      : "bg-yellow-50 border-yellow-500"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">
                      {new Date(appointment.startTime).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {appointment.status === "completed" && (
                      <span className="text-xs text-green-600">✓</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{appointment.patient.email}</p>
                    {appointment.consultationType && (
                      <p className="text-sm text-gray-600">{appointment.consultationType}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {appointment.consultationRoom?.code || 'Sin consultorio'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={`px-2 py-1 text-xs rounded-full text-center ${appointment.status === "completed" ? "bg-green-100 text-green-700" :
                    appointment.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                      appointment.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                    }`}>
                    {appointment.status === "completed" ? "Completada" :
                      appointment.status === "confirmed" ? "Confirmada" :
                        appointment.status === "cancelled" ? "Cancelada" :
                          "Pendiente"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">No tienes citas programadas para hoy</p>
          )}
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Mis Pacientes Asignados</h2>
          <div className="space-y-3">
            {myPatientsResult.success && myPatientsResult.data && myPatientsResult.data.patients.length > 0 ? (
              myPatientsResult.data.patients.slice(0, 5).map((patient) => (
                <div key={patient.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-emerald-700">
                        {patient.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{patient.email}</p>
                      <p className="text-xs text-gray-500">
                        Registrado: {new Date(patient.registeredDate).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${patient.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {patient.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No tienes pacientes asignados</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Próximas Citas</h2>
          <div className="space-y-3">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => {
                const aptDate = new Date(appointment.appointmentDate);
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                let dateLabel = aptDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                if (aptDate.toDateString() === today.toDateString()) {
                  dateLabel = 'Hoy';
                } else if (aptDate.toDateString() === tomorrow.toDateString()) {
                  dateLabel = 'Mañana';
                }

                return (
                  <div key={appointment.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{appointment.patient.email}</p>
                      <p className="text-xs text-gray-500">
                        {dateLabel} a las {new Date(appointment.startTime).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${appointment.status === "confirmed" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                      {appointment.status === "confirmed" ? "Confirmada" : "Pendiente"}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500 py-4">No tienes próximas citas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
