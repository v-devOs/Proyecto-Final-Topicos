import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/app/actions/auth/auth";
import { getPaginatedSchedules } from "@/app/actions/schedule/get-paginated-schedule";
import MySchedulesPageClient from "@/app/components/staff/schedules/MySchedulesPageClient";

export default async function MySchedulesPage() {
  // Verificar autenticación
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const authResult = await verifyToken(token);

  if (!authResult.success || !authResult.user || authResult.user.userType !== "staff") {
    redirect("/login");
  }

  const currentStaffId = authResult.user.userId;

  // Cargar horarios del staff actual
  const initialData = await getPaginatedSchedules({
    staffId: currentStaffId,
    page: 1,
    pageSize: 100, // Cargar todos los horarios
    availableOnly: false,
  });

  if (!initialData.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{initialData.message}</p>
        </div>
      </div>
    );
  }

  const schedules = initialData.data?.schedules.map((s) => ({
    id: s.id,
    staffId: s.staffId,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    available: s.available,
  })) || [];

  return (
    <MySchedulesPageClient
      initialSchedules={schedules}
      currentStaffId={currentStaffId}
    />
  );
}
