"use client";

import { useState } from "react";
import { createOrUpdateConsultationRoom } from "@/app/actions/consultation-room/create-or-update-consultation-room";

interface ConsultationRoomFormProps {
  consultationRoom?: {
    id: number;
    code: string;
    name: string;
    location: string;
    capacity: number;
    active: boolean;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ConsultationRoomForm({
  consultationRoom,
  onSuccess,
  onCancel,
}: ConsultationRoomFormProps) {
  const [formData, setFormData] = useState({
    code: consultationRoom?.code || "",
    name: consultationRoom?.name || "",
    location: consultationRoom?.location || "",
    capacity: consultationRoom?.capacity || 1,
    active: consultationRoom?.active ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!consultationRoom;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const form = e.currentTarget;
      const formDataToSend = new FormData(form);

      // Agregar el ID si es edición
      if (consultationRoom?.id) {
        formDataToSend.set("id", consultationRoom.id.toString());
      }

      const result = await createOrUpdateConsultationRoom(formDataToSend);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-2xl font-bold text-gray-800 mb-6">
        {isEditing ? "Editar Consultorio" : "Crear Consultorio"}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Código *
          </label>
          <input
            type="text"
            name="code"
            required
            maxLength={20}
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="CONS-001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Capacidad *
          </label>
          <input
            type="number"
            name="capacity"
            required
            min={1}
            value={formData.capacity}
            onChange={(e) =>
              setFormData({ ...formData, capacity: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre *
        </label>
        <input
          type="text"
          name="name"
          required
          maxLength={100}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Consultorio Principal"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ubicación *
        </label>
        <input
          type="text"
          name="location"
          required
          maxLength={200}
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Piso 1 - Oficina 101"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="active"
          id="active"
          checked={formData.active}
          onChange={(e) =>
            setFormData({ ...formData, active: e.target.checked })
          }
          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
        />
        <label htmlFor="active" className="ml-2 text-sm text-gray-700">
          Activo
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Procesando..." : isEditing ? "Actualizar" : "Crear"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
