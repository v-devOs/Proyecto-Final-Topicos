"use client";

import { useState, useEffect } from "react";
import { createOrUpdateConsultationRoom } from "@/app/actions/consultation-room/create-or-update-consultation-room";

type ConsultationRoom = {
  id: number;
  code: string;
  name: string;
  location: string;
  capacity: number;
  active: boolean;
};

type ConsultationRoomModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  room?: ConsultationRoom | null;
};

export default function ConsultationRoomModal({
  isOpen,
  onClose,
  onSuccess,
  room,
}: ConsultationRoomModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    location: "",
    capacity: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInitialFormData = () => ({
    code: room?.code || "",
    name: room?.name || "",
    location: room?.location || "",
    capacity: room?.capacity || 1,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, room]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.code.trim() || !formData.name.trim() || !formData.location.trim()) {
      setError("Código, nombre y ubicación son obligatorios");
      return;
    }

    if (formData.capacity < 1) {
      setError("La capacidad debe ser al menos 1");
      return;
    }

    setIsSubmitting(true);

    const formDataToSend = new FormData();
    formDataToSend.append("code", formData.code.trim());
    formDataToSend.append("name", formData.name.trim());
    formDataToSend.append("location", formData.location.trim());
    formDataToSend.append("capacity", formData.capacity.toString());
    formDataToSend.append("active", "true");

    if (room) {
      formDataToSend.append("id", room.id.toString());
    }

    const result = await createOrUpdateConsultationRoom(formDataToSend);
    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.message || "Error al guardar el consultorio");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {room ? "Editar Consultorio" : "Nuevo Consultorio"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Código */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Código *
              </label>
              <input
                type="text"
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ej: C-101"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ej: Consultorio Principal"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Ubicación */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación *
              </label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ej: Planta Baja, Ala Este"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Capacidad */}
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                Capacidad *
              </label>
              <input
                type="number"
                id="capacity"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">Número de personas que puede albergar</p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : room ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
