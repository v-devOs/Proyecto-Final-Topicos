import { getPaginatedPatients } from "@/app/actions/patient/get-paginated-patient";
import PatientsPageClient from "@/app/components/patients/PatientsPageClient";
import prisma from "@/app/lib/prisma";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    active?: string;
  }>;
}

export default async function PatientsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const activeFilter = params.active;

  // Obtener pacientes paginados
  const patientsResult = await getPaginatedPatients({
    page,
    pageSize: 10,
    search,
    activeOnly: activeFilter === "true" ? true : false,
    sortBy: "registeredDate",
    sortOrder: "desc",
  });

  // Obtener lista de staff activo para el dropdown
  const staffList = await prisma.staff.findMany({
    where: {
      active: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
    orderBy: {
      lastName: "asc",
    },
  });

  // Transformar datos para el formato esperado por el cliente
  const patients = patientsResult.data?.patients.map(patient => ({
    ...patient,
    registeredDate: patient.registeredDate.toISOString(),
  })) || [];

  return (
    <PatientsPageClient
      initialPatients={patients}
      totalPages={patientsResult.data?.pagination.totalPages || 1}
      currentPage={patientsResult.data?.pagination.page || 1}
      totalCount={patientsResult.data?.pagination.totalItems || 0}
      staffList={staffList}
    />
  );
}
