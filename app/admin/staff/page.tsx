import { getPaginatedStaff } from "@/app/actions/staff/get-paginated-staff";
import StaffPageClient from "@/app/components/staff/StaffPageClient";

export default async function StaffPage() {
  // Cargar datos iniciales del servidor
  const initialData = await getPaginatedStaff({
    page: 1,
    pageSize: 10,
    activeOnly: false,
  });

  // Si hay error, mostrar mensaje
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

  return <StaffPageClient initialData={initialData.data!} />;
}
