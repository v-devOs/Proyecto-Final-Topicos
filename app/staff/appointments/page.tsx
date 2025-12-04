import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/app/actions/auth/auth";
import { getPaginatedAppointments } from "@/app/actions/appointment/get-paginated-appointment";
import { getPaginatedConsultationRooms } from "@/app/actions/consultation-room/get-paginated-consultation-room";
import MyAppointmentsPageClient from "@/app/components/staff/appointments/MyAppointmentsPageClient";

export default async function MyAppointmentsPage() {
  // Verificar autenticación
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const authResult = await verifyToken(token);

  if (!authResult.success || !authResult.user) {
    redirect("/login");
  }

  // Verificar que es staff
  if (authResult.user.userType !== "staff") {
    redirect("/login");
  }

  const currentStaffId = authResult.user.userId;

  // Obtener citas del staff
  const appointmentsResult = await getPaginatedAppointments({
    staffId: currentStaffId,
    pageSize: 100, // Cargar citas (máximo permitido)
    page: 1,
  });

  // Obtener consultorios disponibles
  const roomsResult = await getPaginatedConsultationRooms({
    pageSize: 100,
    page: 1,
  });

  const appointments =
    appointmentsResult.success && appointmentsResult.data?.appointments
      ? appointmentsResult.data.appointments
      : [];
  const consultationRooms =
    roomsResult.success && roomsResult.data?.consultationRooms
      ? roomsResult.data.consultationRooms
      : [];

  return (
    <MyAppointmentsPageClient
      initialAppointments={appointments}
      consultationRooms={consultationRooms}
      currentStaffId={currentStaffId}
    />
  );
}
