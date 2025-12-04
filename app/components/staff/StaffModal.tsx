"use client";

import { useState, useEffect } from "react";
import { createOrUpdateStaffAction } from "@/app/actions/staff/create-update-staff";
import { getPaginatedAdmins } from "@/app/actions/admin/get-paginated-admin";

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
};

type Admin = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

type StaffModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staff?: Staff | null;
};

export default function StaffModal({ isOpen, onClose, onSuccess, staff }: StaffModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    dateOfBirth: "",
    consultationRoomId: null as number | null,
    createdById: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [consultationRooms, setConsultationRooms] = useState<{ id: number; code: string; name: string }[]>([]);
  const [loadingSelects, setLoadingSelects] = useState(false);

  // Cargar lista de admins y consultorios para los selectores
  useEffect(() => {
    if (isOpen) {
      loadSelectData();
    }
  }, [isOpen]);

  const loadSelectData = async () => {
    setLoadingSelects(true);
    const [adminsResult, roomsResult] = await Promise.all([
      getPaginatedAdmins({ page: 1, pageSize: 100, activeOnly: true }),
      import("@/app/actions/consultation-room/get-paginated-consultation-room").then(m =>
        m.getPaginatedConsultationRooms({ page: 1, pageSize: 100, activeOnly: true })
      )
    ]);

    if (adminsResult.success && adminsResult.data) {
      setAdmins(adminsResult.data.admins);
    }

    if (roomsResult.success && roomsResult.data) {
      setConsultationRooms(roomsResult.data.consultationRooms);
    }

    setLoadingSelects(false);
  };

  const getInitialFormData = () => ({
    firstName: staff?.firstName || "",
    lastName: staff?.lastName || "",
    email: staff?.email || "",
    password: "",
    confirmPassword: "",
    phone: staff?.phone || "",
    dateOfBirth: staff?.dateOfBirth ? new Date(staff.dateOfBirth).toISOString().split('T')[0] : "",
    consultationRoomId: staff?.consultationRoomId || null,
    createdById: 0,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setError("Nombre, apellido y email son obligatorios");
      return;
    }

    if (!staff && !formData.password) {
      setError("La contraseña es obligatoria para nuevos psicólogos");
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsSubmitting(true);

    const dataToSend: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      dateOfBirth: Date;
      consultationRoomId: number | null;
      createdById: number;
      active: boolean;
      id?: number;
      password?: string;
    } = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
      dateOfBirth: new Date(formData.dateOfBirth),
      consultationRoomId: formData.consultationRoomId,
      createdById: formData.createdById,
      active: true,
    };

    if (staff) {
      dataToSend.id = staff.id;
    }

    if (formData.password) {
      dataToSend.password = formData.password;
    }

    const result = await createOrUpdateStaffAction(dataToSend);
    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.message || "Error al guardar el psicólogo");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {staff ? "Editar Psicólogo" : "Nuevo Psicólogo"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label htmlFor="consultationRoomId" className="block text-sm font-medium text-gray-700 mb-1">
                Consultorio Asignado
              </label>
              <select
                id="consultationRoomId"
                value={formData.consultationRoomId || ""}
                onChange={(e) => setFormData({ ...formData, consultationRoomId: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={isSubmitting || loadingSelects}
              >
                <option value="">Sin consultorio</option>
                {loadingSelects ? (
                  <option>Cargando...</option>
                ) : (
                  consultationRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.code} - {room.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label htmlFor="createdById" className="block text-sm font-medium text-gray-700 mb-1">
                Administrador Responsable *
              </label>
              <select
                id="createdById"
                value={formData.createdById}
                onChange={(e) => setFormData({ ...formData, createdById: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
                disabled={isSubmitting || loadingSelects}
              >
                <option value="">Seleccionar</option>
                {loadingSelects ? (
                  <option>Cargando...</option>
                ) : (
                  admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.firstName} {admin.lastName}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Credenciales de Acceso</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña {staff ? "(dejar vacío para no cambiar)" : "*"}
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required={!staff}
                    disabled={isSubmitting}
                    minLength={6}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Contraseña {staff ? "" : "*"}
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required={!staff || !!formData.password}
                    disabled={isSubmitting}
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Guardando..." : staff ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
