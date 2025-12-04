"use client";

import { useState } from "react";
import { getPaginatedStaff } from "@/app/actions/staff/get-paginated-staff";
import StaffTable from "./StaffTable";
import StaffModal from "./StaffModal";
import Pagination from "../ui/Pagination";

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

type PaginationData = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type StaffPageClientProps = {
  initialData: {
    staff: Staff[];
    pagination: PaginationData;
  };
};

export default function StaffPageClient({ initialData }: StaffPageClientProps) {
  const [staff, setStaff] = useState<Staff[]>(initialData.staff);
  const [pagination, setPagination] = useState<PaginationData>(initialData.pagination);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const fetchStaff = async (page: number = pagination.page, search: string = searchTerm) => {
    setIsLoading(true);
    const result = await getPaginatedStaff({
      page,
      pageSize: pagination.pageSize,
      search: search.trim() || undefined,
      activeOnly: showActiveOnly,
    });

    if (result.success && result.data) {
      setStaff(result.data.staff);
      setPagination(result.data.pagination);
    }
    setIsLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStaff(1, searchTerm);
  };

  const handlePageChange = (page: number) => {
    fetchStaff(page);
  };

  const handleEdit = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedStaff(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedStaff(null);
  };

  const handleSuccess = () => {
    fetchStaff(pagination.page);
  };

  const handleToggleActiveFilter = () => {
    setShowActiveOnly(!showActiveOnly);
    // Trigger fetch with new filter
    setTimeout(() => {
      fetchStaff(1);
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Psicólogos</h1>
          <p className="mt-2 text-gray-600">Gestiona el personal psicológico de la clínica</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          Nuevo Psicólogo
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, apellido, email o especialidad..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={handleToggleActiveFilter}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">Solo activos</span>
            </label>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400"
          >
            {isLoading ? "Buscando..." : "Buscar"}
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Psicólogos</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.totalItems}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👨‍⚕️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Pacientes</p>
              <p className="text-2xl font-bold text-gray-900">
                {staff.reduce((acc, s) => acc + (s._count?.assignedPatients || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🧑</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Citas</p>
              <p className="text-2xl font-bold text-gray-900">
                {staff.reduce((acc, s) => acc + (s._count?.appointments || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      ) : (
        <>
          <StaffTable
            initialStaff={staff}
            onEdit={handleEdit}
            onRefresh={handleSuccess}
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* Modal */}
      <StaffModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        staff={selectedStaff}
      />
    </div>
  );
}
