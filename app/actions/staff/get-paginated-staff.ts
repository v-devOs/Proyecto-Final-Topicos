"use server";

import { z } from "zod";
import prisma from "@/app/lib/prisma";

// Schema de validación para paginación
const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().min(1).max(100).default(10),
  search: z.string().optional(),
  activeOnly: z.boolean().default(false),
  consultationRoomId: z.number().positive().optional(),
  sortBy: z
    .enum(["firstName", "lastName", "email", "hireDate", "phone"])
    .default("lastName"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

type StaffPaginatedResponse = {
  success: boolean;
  message?: string;
  data?: {
    staff: Array<{
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
 * Action para obtener staff de forma paginada
 * @param params - Parámetros de paginación, búsqueda y ordenamiento
 * @returns Lista paginada de staff
 */
export async function getPaginatedStaff(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  activeOnly?: boolean;
  consultationRoomId?: number;
  sortBy?: "firstName" | "lastName" | "email" | "hireDate" | "phone";
  sortOrder?: "asc" | "desc";
}): Promise<StaffPaginatedResponse> {
  try {
    // Validar y aplicar valores por defecto
    const validatedParams = paginationSchema.parse({
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
      search: params?.search || undefined,
      activeOnly: params?.activeOnly || false,
      consultationRoomId: params?.consultationRoomId || undefined,
      sortBy: params?.sortBy || "lastName",
      sortOrder: params?.sortOrder || "asc",
    });

    const {
      page,
      pageSize,
      search,
      activeOnly,
      consultationRoomId,
      sortBy,
      sortOrder,
    } = validatedParams;

    // Calcular skip para paginación
    const skip = (page - 1) * pageSize;

    // Construir condiciones de búsqueda
    const whereConditions: {
      active?: boolean;
      consultationRoomId?: number;
      OR?: Array<{
        firstName?: { contains: string; mode: "insensitive" };
        lastName?: { contains: string; mode: "insensitive" };
        email?: { contains: string; mode: "insensitive" };
        phone?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    // Filtrar solo activos si se solicita
    if (activeOnly) {
      whereConditions.active = true;
    }

    // Filtrar por consultorio si se especifica
    if (consultationRoomId) {
      whereConditions.consultationRoomId = consultationRoomId;
    }

    // Búsqueda por texto (firstName, lastName, email, phone)
    if (search && search.trim() !== "") {
      whereConditions.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Obtener total de registros para paginación
    const totalItems = await prisma.staff.count({
      where: whereConditions,
    });

    // Obtener registros paginados
    const staff = await prisma.staff.findMany({
      where: whereConditions,
      skip,
      take: pageSize,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        consultationRoom: {
          select: {
            id: true,
            code: true,
            name: true,
            location: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            schedules: true,
            appointments: true,
            assignedPatients: true,
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
        staff: staff.map((member) => ({
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phone: member.phone,
          dateOfBirth: member.dateOfBirth,
          hireDate: member.hireDate,
          consultationRoomId: member.consultationRoomId,
          active: member.active,
          consultationRoom: member.consultationRoom,
          createdBy: member.createdBy,
          _count: member._count,
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
    console.error("Error en getPaginatedStaff:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: `Parámetros de paginación inválidos: ${error.issues[0].message}`,
      };
    }

    return {
      success: false,
      message: "Error al obtener los miembros del staff",
    };
  }
}

/**
 * Action simplificada para obtener staff paginado desde FormData
 * Útil para usar directamente en formularios de búsqueda
 * @param formData - Datos del formulario
 * @returns Lista paginada de staff
 */
export async function searchStaff(
  formData: FormData
): Promise<StaffPaginatedResponse> {
  const page = formData.get("page") ? Number(formData.get("page")) : 1;
  const pageSize = formData.get("pageSize")
    ? Number(formData.get("pageSize"))
    : 10;
  const search = formData.get("search")?.toString() || undefined;
  const activeOnly = formData.get("activeOnly") === "true";
  const consultationRoomId = formData.get("consultationRoomId")
    ? Number(formData.get("consultationRoomId"))
    : undefined;
  const sortBy = (formData.get("sortBy")?.toString() || "lastName") as
    | "firstName"
    | "lastName"
    | "email"
    | "hireDate"
    | "phone";
  const sortOrder = (formData.get("sortOrder")?.toString() || "asc") as
    | "asc"
    | "desc";

  return getPaginatedStaff({
    page,
    pageSize,
    search,
    activeOnly,
    consultationRoomId,
    sortBy,
    sortOrder,
  });
}
