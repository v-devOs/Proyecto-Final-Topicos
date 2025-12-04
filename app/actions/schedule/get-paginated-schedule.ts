"use server";

import { z } from "zod";
import prisma from "@/app/lib/prisma";

// Schema de validación para paginación
const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().min(1).max(100).default(10),
  staffId: z.number().positive().optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  availableOnly: z.boolean().default(false),
  sortBy: z.enum(["dayOfWeek", "startTime", "endTime"]).default("dayOfWeek"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

type SchedulePaginatedResponse = {
  success: boolean;
  message?: string;
  data?: {
    schedules: Array<{
      id: number;
      staffId: number;
      dayOfWeek: number;
      startTime: Date;
      endTime: Date;
      available: boolean;
      staff: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        consultationRoom: {
          code: string;
          name: string;
          location: string;
        } | null;
      };
    }>;
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
};

// Función helper para formatear día de la semana
const getDayName = (dayOfWeek: number): string => {
  const days = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  return days[dayOfWeek] || "Desconocido";
};

/**
 * Action para obtener horarios de forma paginada
 * @param params - Parámetros de paginación, búsqueda y ordenamiento
 * @returns Lista paginada de horarios
 */
export async function getPaginatedSchedules(params?: {
  page?: number;
  pageSize?: number;
  staffId?: number;
  dayOfWeek?: number;
  availableOnly?: boolean;
  sortBy?: "dayOfWeek" | "startTime" | "endTime";
  sortOrder?: "asc" | "desc";
}): Promise<SchedulePaginatedResponse> {
  try {
    // Validar y aplicar valores por defecto
    const validatedParams = paginationSchema.parse({
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
      staffId: params?.staffId || undefined,
      dayOfWeek: params?.dayOfWeek !== undefined ? params.dayOfWeek : undefined,
      availableOnly: params?.availableOnly || false,
      sortBy: params?.sortBy || "dayOfWeek",
      sortOrder: params?.sortOrder || "asc",
    });

    const {
      page,
      pageSize,
      staffId,
      dayOfWeek,
      availableOnly,
      sortBy,
      sortOrder,
    } = validatedParams;

    // Calcular skip para paginación
    const skip = (page - 1) * pageSize;

    // Construir condiciones de búsqueda
    const whereConditions: {
      staffId?: number;
      dayOfWeek?: number;
      available?: boolean;
    } = {};

    // Filtrar por staff si se especifica
    if (staffId !== undefined) {
      whereConditions.staffId = staffId;
    }

    // Filtrar por día de la semana si se especifica
    if (dayOfWeek !== undefined) {
      whereConditions.dayOfWeek = dayOfWeek;
    }

    // Filtrar solo disponibles si se solicita
    if (availableOnly) {
      whereConditions.available = true;
    }

    // Obtener total de registros para paginación
    const totalItems = await prisma.schedule.count({
      where: whereConditions,
    });

    // Obtener registros paginados
    const schedules = await prisma.schedule.findMany({
      where: whereConditions,
      skip,
      take: pageSize,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            consultationRoom: {
              select: {
                code: true,
                name: true,
                location: true,
              },
            },
          },
        },
      },
    });

    // Calcular información de paginación
    const totalPages = Math.ceil(totalItems / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      success: true,
      data: {
        schedules: schedules.map((schedule) => ({
          id: schedule.id,
          staffId: schedule.staffId,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          available: schedule.available,
          staff: schedule.staff,
        })),
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      },
    };
  } catch (error) {
    console.error("Error en getPaginatedSchedules:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: `Parámetros de paginación inválidos: ${error.issues[0].message}`,
      };
    }

    return {
      success: false,
      message: "Error al obtener los horarios",
    };
  }
}

/**
 * Action simplificada para obtener horarios paginados desde FormData
 * Útil para usar directamente en formularios de búsqueda
 * @param formData - Datos del formulario
 * @returns Lista paginada de horarios
 */
export async function searchSchedules(
  formData: FormData
): Promise<SchedulePaginatedResponse> {
  const page = formData.get("page") ? Number(formData.get("page")) : 1;
  const pageSize = formData.get("pageSize")
    ? Number(formData.get("pageSize"))
    : 10;
  const staffId = formData.get("staffId")
    ? Number(formData.get("staffId"))
    : undefined;
  const dayOfWeek = formData.get("dayOfWeek")
    ? Number(formData.get("dayOfWeek"))
    : undefined;
  const availableOnly = formData.get("availableOnly") === "true";
  const sortBy = (formData.get("sortBy")?.toString() || "dayOfWeek") as
    | "dayOfWeek"
    | "startTime"
    | "endTime";
  const sortOrder = (formData.get("sortOrder")?.toString() || "asc") as
    | "asc"
    | "desc";

  return getPaginatedSchedules({
    page,
    pageSize,
    staffId,
    dayOfWeek,
    availableOnly,
    sortBy,
    sortOrder,
  });
}

/**
 * Action para obtener horarios de un staff específico agrupados por día
 * @param staffId - ID del staff
 * @param availableOnly - Solo horarios disponibles
 * @returns Horarios agrupados por día de la semana
 */
export async function getSchedulesByStaff(
  staffId: number,
  availableOnly: boolean = false
): Promise<{
  success: boolean;
  message?: string;
  data?: {
    staff: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
    schedulesByDay: Array<{
      dayOfWeek: number;
      dayName: string;
      schedules: Array<{
        id: number;
        startTime: Date;
        endTime: Date;
        available: boolean;
      }>;
    }>;
  };
}> {
  try {
    // Verificar que el staff existe
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!staff) {
      return {
        success: false,
        message: "Miembro del staff no encontrado",
      };
    }

    // Obtener todos los horarios del staff
    const schedules = await prisma.schedule.findMany({
      where: {
        staffId,
        ...(availableOnly && { available: true }),
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    // Agrupar por día de la semana
    const schedulesByDay = Array.from({ length: 7 }, (_, dayOfWeek) => {
      const daySchedules = schedules.filter((s) => s.dayOfWeek === dayOfWeek);
      return {
        dayOfWeek,
        dayName: getDayName(dayOfWeek),
        schedules: daySchedules.map((s) => ({
          id: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          available: s.available,
        })),
      };
    }).filter((day) => day.schedules.length > 0);

    return {
      success: true,
      data: {
        staff,
        schedulesByDay,
      },
    };
  } catch (error) {
    console.error("Error en getSchedulesByStaff:", error);
    return {
      success: false,
      message: "Error al obtener los horarios del staff",
    };
  }
}
