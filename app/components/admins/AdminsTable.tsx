"use client";

import { useState } from "react";
import { deleteAdminAction } from "@/app/actions/admin/delete-admin";

type Admin = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  active: boolean;
  createdAt: Date;
  _count?: {
    createdStaff: number;
  };
};

type AdminsTableProps = {
  initialAdmins: Admin[];
  onEdit: (admin: Admin) => void;
  onRefresh: () => void;
};

export default function AdminsTable({ initialAdmins, onEdit, onRefresh }: AdminsTableProps) {
  const [admins, setAdmins] = useState<Admin[]>(initialAdmins);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleSoftDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de desactivar este administrador?")) return;

    setIsDeleting(id);
    const result = await deleteAdminAction(id, false); // Soft delete
    setIsDeleting(null);

    if (result.success) {
      // Actualizar estado local
      setAdmins(admins.map(admin =>
        admin.id === id ? { ...admin, active: false } : admin
      ));
      onRefresh();
    } else {
      alert(result.message || "Error al desactivar administrador");
    }
  };

  const handleHardDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de ELIMINAR PERMANENTEMENTE este administrador? Esta acción no se puede deshacer.")) return;

    setIsDeleting(id);
    const result = await deleteAdminAction(id, true); // Hard delete
    setIsDeleting(null);

    if (result.success) {
      // Remover del estado local
      setAdmins(admins.filter(admin => admin.id !== id));
      onRefresh();
    } else {
      alert(result.message || "Error al eliminar administrador");
    }
  }; return (
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
                Personal Creado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Fecha Creación
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No se encontraron administradores
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id} className={admin.active ? "" : "bg-gray-50 opacity-60"}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    #{admin.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {admin.firstName} {admin.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {admin.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {admin._count?.createdStaff || 0} psicólogos
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${admin.active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                        }`}
                    >
                      {admin.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(admin.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(admin)}
                        className="text-emerald-600 hover:text-emerald-900"
                        disabled={isDeleting === admin.id}
                      >
                        ✏️ Editar
                      </button>
                      {admin.active ? (
                        <button
                          onClick={() => handleSoftDelete(admin.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          disabled={isDeleting === admin.id}
                        >
                          {isDeleting === admin.id ? "⏳" : "🚫"} Desactivar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleHardDelete(admin.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={isDeleting === admin.id}
                        >
                          {isDeleting === admin.id ? "⏳" : "🗑️"} Eliminar
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
