"use server";

import { z } from "zod";
import prisma from "@/app/lib/prisma";

// Schema de validación para paginación
const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().min(1).max(100).default(10),
  search: z.string().optional(),
  activeOnly: z.boolean().default(false),
  sortBy: z.enum(["code", "name", "location", "capacity"]).default("code"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

type ConsultationRoomPaginatedResponse = {
  success: boolean;
  message?: string;
  data?: {
    consultationRooms: Array<{
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

/**
 * Action para obtener cuartos de consulta de forma paginada
 * @param params - Parámetros de paginación, búsqueda y ordenamiento
 * @returns Lista paginada de cuartos de consulta
 */
export async function getPaginatedConsultationRooms(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  activeOnly?: boolean;
  sortBy?: "code" | "name" | "location" | "capacity";
  sortOrder?: "asc" | "desc";
}): Promise<ConsultationRoomPaginatedResponse> {
  try {
    // Validar y aplicar valores por defecto
    const validatedParams = paginationSchema.parse({
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
      search: params?.search || undefined,
      activeOnly: params?.activeOnly || false,
      sortBy: params?.sortBy || "code",
      sortOrder: params?.sortOrder || "asc",
    });

    const { page, pageSize, search, activeOnly, sortBy, sortOrder } =
      validatedParams;

    // Calcular skip para paginación
    const skip = (page - 1) * pageSize;

    // Construir condiciones de búsqueda
    const whereConditions: {
      active?: boolean;
      OR?: Array<{
        code?: { contains: string; mode: "insensitive" };
        name?: { contains: string; mode: "insensitive" };
        location?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    // Filtrar solo activos si se solicita
    if (activeOnly) {
      whereConditions.active = true;
    }

    // Búsqueda por texto (code, name, location)
    if (search && search.trim() !== "") {
      whereConditions.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    // Obtener total de registros para paginación
    const totalItems = await prisma.consultationRoom.count({
      where: whereConditions,
    });

    // Obtener registros paginados
    const consultationRooms = await prisma.consultationRoom.findMany({
      where: whereConditions,
      skip,
      take: pageSize,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        _count: {
          select: {
            staff: true,
            appointments: true,
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
        consultationRooms: consultationRooms.map((room) => ({
          id: room.id,
          code: room.code,
          name: room.name,
          location: room.location,
          capacity: room.capacity,
          active: room.active,
          _count: room._count,
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
    console.error("Error en getPaginatedConsultationRooms:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: `Parámetros de paginación inválidos: ${error.issues[0].message}`,
      };
    }

    return {
      success: false,
      message: "Error al obtener los cuartos de consulta",
    };
  }
}

/**
 * Action simplificada para obtener cuartos de consulta paginados desde FormData
 * Útil para usar directamente en formularios de búsqueda
 * @param formData - Datos del formulario
 * @returns Lista paginada de cuartos de consulta
 */
export async function searchConsultationRooms(
  formData: FormData
): Promise<ConsultationRoomPaginatedResponse> {
  const page = formData.get("page") ? Number(formData.get("page")) : 1;
  const pageSize = formData.get("pageSize")
    ? Number(formData.get("pageSize"))
    : 10;
  const search = formData.get("search")?.toString() || undefined;
  const activeOnly = formData.get("activeOnly") === "true";
  const sortBy = (formData.get("sortBy")?.toString() || "code") as
    | "code"
    | "name"
    | "location"
    | "capacity";
  const sortOrder = (formData.get("sortOrder")?.toString() || "asc") as
    | "asc"
    | "desc";

  return getPaginatedConsultationRooms({
    page,
    pageSize,
    search,
    activeOnly,
    sortBy,
    sortOrder,
  });
}
