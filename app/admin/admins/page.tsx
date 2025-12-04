import { getPaginatedAdmins } from "@/app/actions/admin/get-paginated-admin";
import AdminsPageClient from "../../components/admins/AdminsPageClient";

export default async function AdminsPage() {
  // Obtener los primeros datos
  const result = await getPaginatedAdmins({ page: 1, pageSize: 10 });

  const admins = result.success && result.data ? result.data.admins : [];
  const pagination = result.success && result.data ? result.data.pagination : {
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  return <AdminsPageClient initialAdmins={admins} initialPagination={pagination} />;
}
