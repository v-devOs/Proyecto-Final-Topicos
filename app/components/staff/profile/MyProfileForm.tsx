"use client";

import { useState } from "react";

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

type MyProfileFormProps = {
  staff: Staff;
  consultationRooms: ConsultationRoom[];
  onSave: (data: FormData) => void;
  isLoading: boolean;
};

export default function MyProfileForm({
  staff,
  consultationRooms,
  onSave,
  isLoading,
}: MyProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [formData, setFormData] = useState({
    firstName: staff.firstName,
    lastName: staff.lastName,
    email: staff.email,
    phone: staff.phone || "",
    dateOfBirth: staff.dateOfBirth ? new Date(staff.dateOfBirth).toISOString().split("T")[0] : "",
    consultationRoomId: staff.consultationRoomId?.toString() || "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar contraseñas si se están cambiando
    if (showPasswordFields) {
      if (formData.newPassword !== formData.confirmPassword) {
        alert("Las contraseñas no coinciden");
        return;
      }
      if (formData.newPassword.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres");
        return;
      }
    }

    const data = new FormData();
    data.append("id", staff.id.toString());
    data.append("firstName", formData.firstName);
    data.append("lastName", formData.lastName);
    data.append("email", formData.email);
    if (formData.phone) data.append("phone", formData.phone);
    if (formData.dateOfBirth) data.append("dateOfBirth", formData.dateOfBirth);
    if (formData.consultationRoomId) data.append("consultationRoomId", formData.consultationRoomId);
    if (showPasswordFields && formData.newPassword) {
      data.append("passwordHash", formData.newPassword);
    }

    onSave(data);
  };

  const handleCancel = () => {
    setFormData({
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      phone: staff.phone || "",
      dateOfBirth: staff.dateOfBirth ? new Date(staff.dateOfBirth).toISOString().split("T")[0] : "",
      consultationRoomId: staff.consultationRoomId?.toString() || "",
      newPassword: "",
      confirmPassword: "",
    });
    setIsEditing(false);
    setShowPasswordFields(false);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Información Personal</h2>
          <p className="text-sm text-gray-600 mt-1">
            {isEditing ? "Edita tu información personal" : "Visualiza tu información personal"}
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            ✏️ Editar perfil
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              disabled={!isEditing}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              disabled={!isEditing}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
            />
          </div>
        </div>

        {/* Contacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!isEditing}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
              placeholder="Ej: +1234567890"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
            />
          </div>
        </div>

        {/* Fecha de nacimiento y consultorio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Consultorio asignado</label>
            <select
              value={formData.consultationRoomId}
              onChange={(e) => setFormData({ ...formData, consultationRoomId: e.target.value })}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
            >
              <option value="">Sin asignar</option>
              {consultationRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.code} - {room.name} ({room.location})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Información de solo lectura */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">📋 Información del sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-600">ID:</span>
              <span className="ml-2 text-gray-800">{staff.id}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Fecha de contratación:</span>
              <span className="ml-2 text-gray-800">
                {new Date(staff.hireDate).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Estado:</span>
              <span
                className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${staff.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
              >
                {staff.active ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        </div>

        {/* Cambiar contraseña */}
        {isEditing && (
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">🔒 Cambiar contraseña</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Opcional. Deja en blanco si no deseas cambiarla.
                </p>
              </div>
              {!showPasswordFields && (
                <button
                  type="button"
                  onClick={() => setShowPasswordFields(true)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cambiar contraseña
                </button>
              )}
            </div>

            {showPasswordFields && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Repite la contraseña"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordFields(false);
                      setFormData({ ...formData, newPassword: "", confirmPassword: "" });
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    ✕ Cancelar cambio de contraseña
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botones */}
        {isEditing && (
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Guardando...
                </>
              ) : (
                <>💾 Guardar cambios</>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
