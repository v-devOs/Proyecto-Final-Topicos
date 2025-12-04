"use client";

import { useState } from "react";
import PatientModal from "@/app/components/patients/PatientModal";
import PatientsTable from "@/app/components/patients/PatientsTable";
import Pagination from "@/app/components/ui/Pagination";

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

interface Staff {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface PatientsPageClientProps {
  initialPatients: Patient[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
  staffList: Staff[];
}

export default function PatientsPageClient({
  initialPatients,
  totalPages,
  currentPage,
  totalCount,
  staffList,
}: PatientsPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<string>("all");

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPatient(null);
  };

  const handleSuccess = () => {
    // Recargar la página para refrescar los datos
    window.location.reload();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (filterActive !== "all") params.set("active", filterActive);
    window.location.href = `/admin/patients?${params.toString()}`;
  };

  const handleFilterChange = (filter: string) => {
    setFilterActive(filter);
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (filter !== "all") params.set("active", filter);
    window.location.href = `/admin/patients?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Pacientes
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra la información de los pacientes ({totalCount} registrados)
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedPatient(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/50 transition-all hover:from-emerald-600 hover:to-teal-700"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nuevo Paciente
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar paciente
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, apellido, control o email..."
                  className="block w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>

            {/* Filtro de estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filterActive}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="all">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Buscar
            </button>
            {(searchTerm || filterActive !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setFilterActive("all");
                  window.location.href = "/admin/patients";
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tabla de pacientes */}
      <PatientsTable
        patients={initialPatients}
        onEdit={handleEdit}
        onDelete={handleSuccess}
      />

      {/* Paginación */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            const params = new URLSearchParams(window.location.search);
            params.set("page", page.toString());
            window.location.href = `/admin/patients?${params.toString()}`;
          }}
        />
      )}

      {/* Modal */}
      <PatientModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        patient={selectedPatient}
        onSuccess={handleSuccess}
        staffList={staffList}
      />
    </div>
  );
}
