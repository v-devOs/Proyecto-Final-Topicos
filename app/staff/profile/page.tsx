import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/app/actions/auth/auth";
import prisma from "@/app/lib/prisma";
import { getPaginatedConsultationRooms } from "@/app/actions/consultation-room/get-paginated-consultation-room";
import MyProfilePageClient from "@/app/components/staff/profile/MyProfilePageClient";

export default async function MyProfilePage() {
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

  // Obtener información del staff
  const staff = await prisma.staff.findUnique({
    where: { id: currentStaffId },
    include: {
      consultationRoom: {
        select: {
          id: true,
          code: true,
          name: true,
          location: true,
        },
      },
    },
  });

  if (!staff) {
    redirect("/login");
  }

  // Obtener consultorios disponibles
  const roomsResult = await getPaginatedConsultationRooms({
    pageSize: 100,
    page: 1,
  });

  const consultationRooms =
    roomsResult.success && roomsResult.data?.consultationRooms
      ? roomsResult.data.consultationRooms
      : [];

  return (
    <MyProfilePageClient
      staff={staff}
      consultationRooms={consultationRooms}
    />
  );
}
