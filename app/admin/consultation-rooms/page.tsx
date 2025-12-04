import { getPaginatedConsultationRooms } from "@/app/actions/consultation-room/get-paginated-consultation-room";
import ConsultationRoomsPageClient from "@/app/components/consultation-rooms/ConsultationRoomsPageClient";

export default async function ConsultationRoomsPage() {
  // Cargar datos iniciales del servidor
  const initialData = await getPaginatedConsultationRooms({
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

  return <ConsultationRoomsPageClient initialData={initialData.data!} />;
}
