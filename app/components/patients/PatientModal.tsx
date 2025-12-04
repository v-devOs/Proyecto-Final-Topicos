"use client";

import { useState, useEffect } from "react";
import { createOrUpdatePatientAction } from "@/app/actions/patient/create-update-patient";

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  nuControl: string;
  email: string;
  registeredDate: string;
  active: boolean;
  assignedPsychologist: number | null;
}

interface Staff {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
  onSuccess: () => void;
  staffList: Staff[];
}

export default function PatientModal({
  isOpen,
  onClose,
  patient,
  onSuccess,
  staffList,
}: PatientModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    nuControl: "",
    email: "",
    assignedPsychologist: "",
    active: true,
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName,
        lastName: patient.lastName,
        nuControl: patient.nuControl,
        email: patient.email,
        assignedPsychologist: patient.assignedPsychologist?.toString() || "",
        active: patient.active,
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        nuControl: "",
        email: "",
        assignedPsychologist: "",
        active: true,
      });
    }
    setError("");
  }, [patient, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const dataToSend: {
        firstName: string;
        lastName: string;
        nuControl: string;
        email: string;
        active: boolean;
        id?: number;
        assignedPsychologist?: number | null;
      } = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        nuControl: formData.nuControl,
        email: formData.email,
        active: formData.active,
      };

      if (patient) {
        dataToSend.id = patient.id;
      }

      if (formData.assignedPsychologist) {
        dataToSend.assignedPsychologist = parseInt(formData.assignedPsychologist);
      } else {
        dataToSend.assignedPsychologist = null;
      }

      const result = await createOrUpdatePatientAction(dataToSend);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Error al guardar el paciente");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold text-white">
            {patient ? "Editar Paciente" : "Nuevo Paciente"}
          </h2>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                required
                maxLength={100}
              />
            </div>

            {/* Apellidos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellidos <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                required
                maxLength={100}
              />
            </div>

            {/* Número de Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Control <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nuControl}
                onChange={(e) =>
                  setFormData({ ...formData, nuControl: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                required
                maxLength={50}
                placeholder="L21030060"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                required
                maxLength={150}
              />
            </div>

            {/* Psicólogo Asignado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Psicólogo Asignado
              </label>
              <select
                value={formData.assignedPsychologist}
                onChange={(e) =>
                  setFormData({ ...formData, assignedPsychologist: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="">Sin asignar</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.firstName} {staff.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado */}
            <div className="flex items-center pt-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData({ ...formData, active: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Paciente Activo
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-medium text-white hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 transition-all"
            >
              {loading ? "Guardando..." : patient ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
