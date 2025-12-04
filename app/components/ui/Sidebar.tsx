"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface MenuItem {
  name: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  userRole?: "admin" | "staff" | null;
  userName?: string;
}

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Menú para Administradores
  const adminMenu: MenuItem[] = [
    { name: "Dashboard", href: "/admin/dashboard", icon: "📊" },
    { name: "Administradores", href: "/admin/admins", icon: "👤" },
    { name: "Psicólogos", href: "/admin/staff", icon: "👨‍⚕️" },
    { name: "Pacientes", href: "/admin/patients", icon: "🧑" },
    { name: "Horarios", href: "/admin/schedules", icon: "📅" },
    { name: "Citas", href: "/admin/appointments", icon: "📋" },
    { name: "Consultorios", href: "/admin/rooms", icon: "🏢" },
  ];

  // Menú para Staff/Psicólogos
  const staffMenu: MenuItem[] = [
    { name: "Dashboard", href: "/staff/dashboard", icon: "📊" },
    { name: "Mis Horarios", href: "/staff/schedules", icon: "📅" },
    { name: "Mis Citas", href: "/staff/appointments", icon: "📋" },
    { name: "Mis Pacientes", href: "/staff/patients", icon: "🧑" },
    { name: "Mi Perfil", href: "/staff/profile", icon: "👤" },
  ];

  // Seleccionar menú según el rol
  const menuItems = userRole === "admin" ? adminMenu : staffMenu;

  const handleLogout = async () => {
    // Limpiar cookie/token
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/");
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-gradient-to-b from-emerald-700 to-emerald-900 text-white z-50
          transition-all duration-300 ease-in-out
          ${isCollapsed ? "w-20" : "w-64"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-emerald-600">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏥</span>
              <h1 className="text-xl font-bold">Clínica Psico</h1>
            </div>
          )}
          {isCollapsed && <span className="text-2xl mx-auto">🏥</span>}

          {/* Botón de colapsar (desktop) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block text-white hover:bg-emerald-600 rounded p-1"
          >
            {isCollapsed ? "→" : "←"}
          </button>
        </div>

        {/* User Info */}
        {!isCollapsed && (
          <div className="p-4 border-b border-emerald-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-lg font-bold">
                {userName?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName || "Usuario"}</p>
                <p className="text-xs text-emerald-300">
                  {userRole === "admin" ? "Administrador" : "Psicólogo"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-lg transition-colors
                      ${isActive
                        ? "bg-emerald-600 text-white"
                        : "text-emerald-100 hover:bg-emerald-600/50"
                      }
                      ${isCollapsed ? "justify-center" : ""}
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {!isCollapsed && (
                      <span className="text-sm font-medium">{item.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer - Logout */}
        <div className="p-4 border-t border-emerald-600">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-3 rounded-lg
              text-emerald-100 hover:bg-red-600/80 transition-colors
              ${isCollapsed ? "justify-center" : ""}
            `}
            title={isCollapsed ? "Cerrar Sesión" : undefined}
          >
            <span className="text-xl">🚪</span>
            {!isCollapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Botón de menú móvil */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-emerald-600 text-white p-3 rounded-lg shadow-lg"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </>
  );
}
