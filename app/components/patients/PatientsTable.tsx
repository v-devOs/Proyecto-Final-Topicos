"use client";

import { useState } from "react";
import { deletePatientAction } from "@/app/actions/patient/delete-patient";

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  nuControl: string;
  email: string;
  registeredDate: string;
  active: boolean;
  assignedPsychologist: number | null;
  psychologist?: {
    firstName: string;
    lastName: string;
  } | null;
  _count?: {
    appointments: number;
  };
}

interface PatientsTableProps {
  patients: Patient[];
  onEdit: (patient: Patient) => void;
  onDelete: () => void;
}

export default function PatientsTable({
  patients,
  onEdit,
  onDelete,
}: PatientsTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async (id: number, name: string) => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar al paciente "${name}"?`
      )
    ) {
      return;
    }

    setDeletingId(id);
    setDeleteError("");

    try {
      const result = await deletePatientAction(id);

      if (result.success) {
        onDelete();
      } else {
        setDeleteError(result.message);
        alert(result.message);
      }
    } catch (error) {
      console.error("Error al eliminar paciente:", error);
      alert("Error al eliminar el paciente");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {deleteError && (
        <div className="border-b border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {deleteError}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Control
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Paciente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Psicólogo Asignado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Citas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Fecha Registro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {patients.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <svg
                      className="mb-2 h-12 w-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <p className="text-sm font-medium">No hay pacientes registrados</p>
                    <p className="text-xs mt-1">Agrega tu primer paciente para comenzar</p>
                  </div>
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr
                  key={patient.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Control */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                        {patient.nuControl}
                      </span>
                    </div>
                  </td>

                  {/* Paciente */}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold">
                        {patient.firstName.charAt(0)}
                        {patient.lastName.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{patient.email}</div>
                  </td>

                  {/* Psicólogo Asignado */}
                  <td className="px-6 py-4">
                    {patient.psychologist ? (
                      <div className="text-sm text-gray-900">
                        {patient.psychologist.firstName} {patient.psychologist.lastName}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Sin asignar</span>
                    )}
                  </td>

                  {/* Citas */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {patient._count?.appointments || 0} citas
                    </span>
                  </td>

                  {/* Fecha Registro */}
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(patient.registeredDate).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  {/* Estado */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${patient.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                        }`}
                    >
                      {patient.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(patient)}
                        className="text-emerald-600 hover:text-emerald-900 transition-colors"
                        title="Editar"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(
                            patient.id,
                            `${patient.firstName} ${patient.lastName}`
                          )
                        }
                        disabled={deletingId === patient.id}
                        className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
                        title="Eliminar"
                      >
                        {deletingId === patient.id ? (
                          <svg
                            className="h-5 w-5 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
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
