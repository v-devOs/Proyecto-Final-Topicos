"use client";

type ConsultationRoom = {
  id: number;
  code: string;
  name: string;
  location: string;
  capacity: number;
  active: boolean;
  _count?: {
    staff: number;
    appointments: number;
  };
};

type ConsultationRoomsTableProps = {
  consultationRooms: ConsultationRoom[];
  onEdit: (room: ConsultationRoom) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number, currentStatus: boolean) => void;
};

export default function ConsultationRoomsTable({
  consultationRooms,
  onEdit,
  onDelete,
  onToggleActive,
}: ConsultationRoomsTableProps) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Código
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ubicación
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Capacidad
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Personal
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Citas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {consultationRooms.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                No se encontraron consultorios
              </td>
            </tr>
          ) : (
            consultationRooms.map((room) => (
              <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {room.code}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{room.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{room.location}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 text-center">
                    {room.capacity}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 text-center">
                    {room._count?.staff || 0}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 text-center">
                    {room._count?.appointments || 0}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${room.active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                      }`}
                  >
                    {room.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => onEdit(room)}
                    className="text-emerald-600 hover:text-emerald-900 transition-colors"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  {room.active ? (
                    <button
                      onClick={() => onToggleActive(room.id, room.active)}
                      className="text-orange-600 hover:text-orange-900 transition-colors"
                      title="Desactivar"
                    >
                      🔒
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onToggleActive(room.id, room.active)}
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="Activar"
                      >
                        🔓
                      </button>
                      <button
                        onClick={() => onDelete(room.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Eliminar permanentemente"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
