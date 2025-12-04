import { getPaginatedSchedules } from "@/app/actions/schedule/get-paginated-schedule";
import SchedulesPageClient from "@/app/components/schedules/SchedulesPageClient";

export default async function SchedulesPage() {
  const initialData = await getPaginatedSchedules({
    page: 1,
    pageSize: 10,
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

  return <SchedulesPageClient initialData={initialData.data!} />;
}
