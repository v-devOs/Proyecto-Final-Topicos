import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/app/actions/auth/auth";
import Sidebar from "../components/ui/Sidebar";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar autenticación
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/");
  }

  // Verificar token y rol
  const verification = await verifyToken(token);

  if (!verification.success || verification.user?.userType !== "staff") {
    redirect("/");
  }

  const userName = verification.user?.email?.split("@")[0] || "Staff";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar userRole="staff" userName={userName} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:ml-64">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
