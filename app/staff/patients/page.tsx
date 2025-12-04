import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/app/actions/auth/auth";
import { getPaginatedPatients } from "@/app/actions/patient/get-paginated-patient";
import PatientsPageClient from "@/app/components/patients/PatientsPageClient";
import prisma from "@/app/lib/prisma";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function StaffPatientsPage({ searchParams }: PageProps) {
  // Verificar autenticación y obtener el staffId
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
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";

  // Obtener solo los pacientes asignados a este psicólogo
  const patientsResult = await getPaginatedPatients({
    page,
    pageSize: 10,
    search,
    assignedPsychologist: staffId,
    activeOnly: true,
    sortBy: "lastName",
    sortOrder: "asc",
  });

  // Obtener lista de staff para mostrar en modal (solo el actual)
  const staffList = await prisma.staff.findMany({
    where: {
      id: staffId,
      active: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  // Transformar datos para el formato esperado por el cliente
  const patients = patientsResult.data?.patients.map(patient => ({
    ...patient,
    registeredDate: patient.registeredDate.toISOString(),
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header personalizado para staff */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Mis Pacientes
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Pacientes asignados a ti ({patientsResult.data?.pagination.totalItems || 0} pacientes)
          </p>
        </div>
      </div>

      <PatientsPageClient
        initialPatients={patients}
        totalPages={patientsResult.data?.pagination.totalPages || 1}
        currentPage={patientsResult.data?.pagination.page || 1}
        totalCount={patientsResult.data?.pagination.totalItems || 0}
        staffList={staffList}
      />
    </div>
  );
}
