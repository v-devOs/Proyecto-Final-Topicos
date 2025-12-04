import { getPaginatedAppointments } from "@/app/actions/appointment/get-paginated-appointment";
import AppointmentsPageClient from "@/app/components/appointments/AppointmentsPageClient";

export default async function AppointmentsPage() {
  const initialData = await getPaginatedAppointments({
    page: 1,
    pageSize: 10,
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

  return <AppointmentsPageClient initialData={initialData.data!} />;
}
