"use server";

import { z } from "zod";
import prisma from "@/app/lib/prisma";

// Schema de validación para paginación
const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().min(1).max(100).default(10),
  search: z.string().optional(),
  activeOnly: z.boolean().default(false),
  sortBy: z
    .enum(["email", "firstName", "lastName", "createdAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

type AdminPaginatedResponse = {
  success: boolean;
  message?: string;
  data?: {
    admins: Array<{
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      active: boolean;
      createdAt: Date;
      _count?: {
        createdStaff: number;
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
 * Action para obtener administradores de forma paginada
 * @param params - Parámetros de paginación, búsqueda y ordenamiento
 * @returns Lista paginada de administradores
 */
export async function getPaginatedAdmins(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  activeOnly?: boolean;
  sortBy?: "email" | "firstName" | "lastName" | "createdAt";
  sortOrder?: "asc" | "desc";
}): Promise<AdminPaginatedResponse> {
  try {
    // Validar y aplicar valores por defecto
    const validatedParams = paginationSchema.parse({
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
      search: params?.search || undefined,
      activeOnly: params?.activeOnly || false,
      sortBy: params?.sortBy || "createdAt",
      sortOrder: params?.sortOrder || "desc",
    });

    const { page, pageSize, search, activeOnly, sortBy, sortOrder } =
      validatedParams;

    // Calcular skip para paginación
    const skip = (page - 1) * pageSize;

    // Construir condiciones de búsqueda
    const whereConditions: {
      active?: boolean;
      OR?: Array<{
        email?: { contains: string; mode: "insensitive" };
        firstName?: { contains: string; mode: "insensitive" };
        lastName?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    // Filtrar solo activos si se solicita
    if (activeOnly) {
      whereConditions.active = true;
    }

    // Búsqueda por texto
    if (search && search.trim() !== "") {
      whereConditions.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    // Contar total de items
    const totalItems = await prisma.admin.count({
      where: whereConditions,
    });

    // Obtener administradores paginados
    const admins = await prisma.admin.findMany({
      where: whereConditions,
      skip,
      take: pageSize,
      orderBy: {
        [sortBy]: sortOrder,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        active: true,
        createdAt: true,
        _count: {
          select: {
            createdStaff: true,
          },
        },
      },
    });

    // Calcular metadatos de paginación
    const totalPages = Math.ceil(totalItems / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      success: true,
      data: {
        admins,
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
    console.error("Error en getPaginatedAdmins:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: `Parámetros de paginación inválidos: ${error.issues[0].message}`,
      };
    }

    return {
      success: false,
      message: "Error al obtener los administradores",
    };
  }
}

/**
 * Action simplificada para obtener administradores paginados desde FormData
 * @param formData - Datos del formulario
 * @returns Lista paginada de administradores
 */
export async function searchAdmins(
  formData: FormData
): Promise<AdminPaginatedResponse> {
  const page = formData.get("page") ? Number(formData.get("page")) : 1;
  const pageSize = formData.get("pageSize")
    ? Number(formData.get("pageSize"))
    : 10;
  const search = formData.get("search")?.toString() || undefined;
  const activeOnly = formData.get("activeOnly") === "true";
  const sortBy = (formData.get("sortBy")?.toString() || "createdAt") as
    | "email"
    | "firstName"
    | "lastName"
    | "createdAt";
  const sortOrder = (formData.get("sortOrder")?.toString() || "desc") as
    | "asc"
    | "desc";

  return getPaginatedAdmins({
    page,
    pageSize,
    search,
    activeOnly,
    sortBy,
    sortOrder,
  });
}
