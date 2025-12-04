"use server";

import { z } from "zod";
import prisma from "@/app/lib/prisma";

// Schema de validación para consultation room
const consultationRoomSchema = z.object({
  id: z.number().int().positive().optional(), // Para update
  code: z
    .string()
    .min(1, { message: "El código es requerido" })
    .max(20, { message: "El código no puede exceder 20 caracteres" })
    .regex(/^[A-Z0-9-]+$/, {
      message:
        "El código debe contener solo letras mayúsculas, números y guiones",
    }),
  name: z
    .string()
    .min(1, { message: "El nombre es requerido" })
    .max(100, { message: "El nombre no puede exceder 100 caracteres" }),
  location: z
    .string()
    .min(1, { message: "La ubicación es requerida" })
    .max(200, { message: "La ubicación no puede exceder 200 caracteres" }),
  capacity: z
    .number()
    .int()
    .positive({ message: "La capacidad debe ser un número positivo" })
    .default(1),
  active: z.boolean().default(true),
});

// Tipos de respuesta
type ConsultationRoomResponse = {
  success: boolean;
  message: string;
  consultationRoom?: {
    id: number;
    code: string;
    name: string;
    location: string;
    capacity: number;
    active: boolean;
  };
};

/**
 * Action para crear o actualizar un cuarto de consulta usando upsert de Prisma
 * @param formData - Datos del formulario
 * @returns Respuesta con el cuarto de consulta creado/actualizado
 */
export async function createOrUpdateConsultationRoom(
  formData: FormData
): Promise<ConsultationRoomResponse> {
  try {
    // Extraer y validar datos del formulario
    const rawData = {
      id: formData.get("id") ? Number(formData.get("id")) : undefined,
      code: formData.get("code"),
      name: formData.get("name"),
      location: formData.get("location"),
      capacity: formData.get("capacity") ? Number(formData.get("capacity")) : 1,
      active: formData.get("active") === "true",
    };

    // Validar con Zod
    const validatedData = consultationRoomSchema.safeParse(rawData);

    if (!validatedData.success) {
      const firstError = validatedData.error.issues[0];
      return {
        success: false,
        message: firstError.message,
      };
    }

    const { id, code, name, location, capacity, active } = validatedData.data;

    // Si hay ID, usar upsert con ID como identificador único
    // Si no hay ID, verificar que el código no exista antes de crear
    if (!id) {
      const existingRoom = await prisma.consultationRoom.findUnique({
        where: { code },
      });

      if (existingRoom) {
        return {
          success: false,
          message: `Ya existe un cuarto de consulta con el código "${code}"`,
        };
      }
    } else {
      // Si estamos actualizando, verificar que el código no exista en otro cuarto
      const existingRoom = await prisma.consultationRoom.findFirst({
        where: {
          code,
          NOT: { id },
        },
      });

      if (existingRoom) {
        return {
          success: false,
          message: `Ya existe otro cuarto de consulta con el código "${code}"`,
        };
      }
    }

    // Usar upsert de Prisma
    const consultationRoom = await prisma.consultationRoom.upsert({
      where: { id: id || 0 }, // Si no hay id, usamos 0 que no existirá
      create: {
        code,
        name,
        location,
        capacity,
        active,
      },
      update: {
        code,
        name,
        location,
        capacity,
        active,
      },
    });

    return {
      success: true,
      message: id
        ? "Cuarto de consulta actualizado exitosamente"
        : "Cuarto de consulta creado exitosamente",
      consultationRoom: {
        id: consultationRoom.id,
        code: consultationRoom.code,
        name: consultationRoom.name,
        location: consultationRoom.location,
        capacity: consultationRoom.capacity,
        active: consultationRoom.active,
      },
    };
  } catch (error) {
    console.error("Error en createOrUpdateConsultationRoom:", error);
    return {
      success: false,
      message:
        "Error al crear/actualizar el cuarto de consulta. Intente nuevamente",
    };
  }
}
