"use client";

import { useState, useEffect } from "react";
import { createOrUpdatePatientAction } from "@/app/actions/patient/create-update-patient";
import { getPaginatedStaff } from "@/app/actions/staff/get-paginated-staff";

interface PatientFormProps {
  patient?: {
    id: number;
    email: string;
    registeredDate: Date;
    assignedPsychologist: number | null;
    active: boolean;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PatientForm({
  patient,
  onSuccess,
  onCancel,
}: PatientFormProps) {
  const [formData, setFormData] = useState({
    email: patient?.email || "",
    registeredDate: patient?.registeredDate
      ? new Date(patient.registeredDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    assignedPsychologist: patient?.assignedPsychologist?.toString() || "",
    active: patient?.active ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffList, setStaffList] = useState<
    Array<{ id: number; firstName: string; lastName: string }>
  >([]);

  const isEditing = !!patient;

  // Cargar lista de psicólogos activos
  useEffect(() => {
    const loadStaff = async () => {
      setLoadingStaff(true);
      try {
        const result = await getPaginatedStaff({
          page: 1,
          pageSize: 100,
          activeOnly: true,
        });

        if (result.success && result.data) {
          setStaffList(result.data.staff);
        }
      } catch (err) {
        console.error("Error al cargar psicólogos:", err);
      } finally {
        setLoadingStaff(false);
      }
    };

    loadStaff();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await createOrUpdatePatientAction({
        ...(patient?.id && { id: patient.id }),
        email: formData.email,
        registeredDate: new Date(formData.registeredDate),
        assignedPsychologist: formData.assignedPsychologist
          ? parseInt(formData.assignedPsychologist)
          : null,
        active: formData.active,
      });

      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Error al procesar la solicitud");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Título */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? "Editar Paciente" : "Nuevo Paciente"}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {isEditing
            ? "Actualiza la información del paciente"
            : "Completa los datos del nuevo paciente"}
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Campos del formulario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email */}
        <div className="md:col-span-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
            placeholder="paciente@ejemplo.com"
          />
        </div>

        {/* Fecha de Registro */}
        <div>
          <label
            htmlFor="registeredDate"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Fecha de Registro <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="registeredDate"
            name="registeredDate"
            value={formData.registeredDate}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
          />
        </div>

        {/* Psicólogo Asignado */}
        <div>
          <label
            htmlFor="assignedPsychologist"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Psicólogo Asignado
          </label>
          <select
            id="assignedPsychologist"
            name="assignedPsychologist"
            value={formData.assignedPsychologist}
            onChange={handleChange}
            disabled={loadingStaff}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors disabled:bg-gray-100"
          >
            <option value="">Sin asignar</option>
            {staffList.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.firstName} {staff.lastName}
              </option>
            ))}
          </select>
          {loadingStaff && (
            <p className="mt-1 text-xs text-gray-500">
              Cargando psicólogos...
            </p>
          )}
        </div>

        {/* Estado Activo */}
        <div className="md:col-span-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              name="active"
              checked={formData.active}
              onChange={handleChange}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 text-sm text-gray-700">
              Paciente activo
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Los pacientes inactivos no pueden agendar nuevas citas
          </p>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Procesando..." : isEditing ? "Actualizar" : "Crear Paciente"}
        </button>
      </div>
    </form>
  );
}
