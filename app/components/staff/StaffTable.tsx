"use client";

import { useState } from "react";
import { deleteStaffAction } from "@/app/actions/staff/delete-staff";

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
  consultationRoom?: {
    id: number;
    code: string;
    name: string;
    location: string;
  } | null;
  createdBy?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  _count?: {
    schedules: number;
    appointments: number;
    assignedPatients: number;
  };
};

type StaffTableProps = {
  initialStaff: Staff[];
  onEdit: (staff: Staff) => void;
  onRefresh: () => void;
};

export default function StaffTable({ initialStaff, onEdit, onRefresh }: StaffTableProps) {
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleSoftDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de desactivar este psicólogo?")) return;

    setIsDeleting(id);
    const result = await deleteStaffAction(id, false); // Soft delete
    setIsDeleting(null);

    if (result.success) {
      // Actualizar estado local
      setStaff(staff.map(s =>
        s.id === id ? { ...s, active: false } : s
      ));
      onRefresh();
    } else {
      alert(result.message || "Error al desactivar psicólogo");
    }
  };

  const handleHardDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de ELIMINAR PERMANENTEMENTE este psicólogo? Esta acción no se puede deshacer.")) return;

    setIsDeleting(id);
    const result = await deleteStaffAction(id, true); // Hard delete
    setIsDeleting(null);

    if (result.success) {
      // Remover del estado local
      setStaff(staff.filter(s => s.id !== id));
      onRefresh();
    } else {
      alert(result.message || "Error al eliminar psicólogo");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-emerald-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Teléfono
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Consultorio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Fecha Contratación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Pacientes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staff.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                  No se encontraron psicólogos
                </td>
              </tr>
            ) : (
              staff.map((s) => (
                <tr key={s.id} className={s.active ? "" : "bg-gray-50 opacity-60"}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    #{s.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {s.firstName} {s.lastName}
                    </div>
                    {s.createdBy && (
                      <div className="text-xs text-gray-500">
                        Por: {s.createdBy.firstName} {s.createdBy.lastName}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {s.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {s.phone || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {s.consultationRoom ? `${s.consultationRoom.code} - ${s.consultationRoom.name}` : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(s.hireDate).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {s._count?.assignedPatients || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${s.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                        }`}
                    >
                      {s.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(s)}
                        className="text-emerald-600 hover:text-emerald-900"
                        disabled={isDeleting === s.id}
                      >
                        ✏️ Editar
                      </button>
                      {s.active ? (
                        <button
                          onClick={() => handleSoftDelete(s.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          disabled={isDeleting === s.id}
                        >
                          {isDeleting === s.id ? "⏳" : "🚫"} Desactivar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleHardDelete(s.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={isDeleting === s.id}
                        >
                          {isDeleting === s.id ? "⏳" : "🗑️"} Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
