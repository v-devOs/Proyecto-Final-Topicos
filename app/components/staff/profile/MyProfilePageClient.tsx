"use client";

import { useState } from "react";
import MyProfileForm from "./MyProfileForm";
import { createOrUpdateStaffAction } from "@/app/actions/staff/create-update-staff";

type Staff = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: Date | null;
  hireDate: Date;
  consultationRoomId: number | null;
  active: boolean;
  consultationRoom: {
    id: number;
    code: string;
    name: string;
    location: string;
  } | null;
};

type ConsultationRoom = {
  id: number;
  code: string;
  name: string;
  location: string;
};

type MyProfilePageClientProps = {
  staff: Staff;
  consultationRooms: ConsultationRoom[];
};

export default function MyProfilePageClient({
  staff,
  consultationRooms,
}: MyProfilePageClientProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (data: FormData) => {
    setIsLoading(true);

    const staffData = {
      id: Number(data.get("id")),
      firstName: data.get("firstName") as string,
      lastName: data.get("lastName") as string,
      email: data.get("email") as string,
      active: staff.active, // Mantener el estado actual
      phone: data.get("phone") ? (data.get("phone") as string) : undefined,
      dateOfBirth: data.get("dateOfBirth") ? new Date(data.get("dateOfBirth") as string) : undefined,
      consultationRoomId: data.get("consultationRoomId")
        ? Number(data.get("consultationRoomId"))
        : undefined,
      password: data.get("passwordHash") ? (data.get("passwordHash") as string) : undefined,
    };

    const result = await createOrUpdateStaffAction(staffData);

    if (result.success) {
      alert("✅ Perfil actualizado exitosamente");
      window.location.reload();
    } else {
      alert("❌ Error al actualizar el perfil: " + result.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Mi Perfil 👤</h1>
        <p className="text-gray-600 mt-2">
          Gestiona tu información personal y configuración de cuenta
        </p>
      </div>

      {/* Tarjeta de resumen */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-4xl">
            👤
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">
              {staff.firstName} {staff.lastName}
            </h2>
            <p className="text-emerald-100 mt-1">{staff.email}</p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1">
                📞 {staff.phone || "Sin teléfono"}
              </span>
              {staff.consultationRoom && (
                <span className="flex items-center gap-1">
                  🏢 {staff.consultationRoom.code} - {staff.consultationRoom.name}
                </span>
              )}
            </div>
          </div>
          <div>
            <span
              className={`px-4 py-2 rounded-full font-semibold ${staff.active
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
                }`}
            >
              {staff.active ? "✓ Activo" : "✕ Inactivo"}
            </span>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">📅</div>
          <div className="text-sm text-gray-600">Fecha de contratación</div>
          <div className="text-lg font-semibold text-gray-800 mt-1">
            {new Date(staff.hireDate).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">🎂</div>
          <div className="text-sm text-gray-600">Fecha de nacimiento</div>
          <div className="text-lg font-semibold text-gray-800 mt-1">
            {staff.dateOfBirth
              ? new Date(staff.dateOfBirth).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
              : "No registrada"}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">🏢</div>
          <div className="text-sm text-gray-600">Consultorio</div>
          <div className="text-lg font-semibold text-gray-800 mt-1">
            {staff.consultationRoom ? (
              <>
                {staff.consultationRoom.code}
                <span className="text-sm font-normal text-gray-600 block">
                  {staff.consultationRoom.name}
                </span>
              </>
            ) : (
              "Sin asignar"
            )}
          </div>
        </div>
      </div>

      {/* Formulario de perfil */}
      <MyProfileForm
        staff={staff}
        consultationRooms={consultationRooms}
        onSave={handleSave}
        isLoading={isLoading}
      />

      {/* Ayuda y soporte */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">💡 Ayuda</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Puedes actualizar tu información personal en cualquier momento.</li>
          <li>• Para cambiar tu contraseña, haz clic en &quot;Cambiar contraseña&quot; mientras editas.</li>
          <li>• Si necesitas cambiar tu email o estado de cuenta, contacta al administrador.</li>
          <li>• Tu consultorio asignado determina dónde atenderás a los pacientes.</li>
        </ul>
      </div>
    </div>
  );
}
