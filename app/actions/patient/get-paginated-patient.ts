"use server";

import { z } from "zod";
import prisma from "@/app/lib/prisma";

// Schema de validación para paginación
const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().min(1).max(100).default(10),
  search: z.string().optional(),
  activeOnly: z.boolean().default(false),
  assignedPsychologist: z.number().positive().optional(),
  sortBy: z
    .enum(["firstName", "lastName", "nuControl", "email", "registeredDate"])
    .default("registeredDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

type PatientPaginatedResponse = {
  success: boolean;
  message?: string;
  data?: {
    patients: Array<{
      id: number;
      firstName: string;
      lastName: string;
      nuControl: string;
      email: string;
      registeredDate: Date;
      active: boolean;
      assignedPsychologist: number | null;
      psychologist?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
      } | null;
      _count?: {
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
 * Action para obtener pacientes de forma paginada
 * @param params - Parámetros de paginación, búsqueda y ordenamiento
 * @returns Lista paginada de pacientes
 */
export async function getPaginatedPatients(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  activeOnly?: boolean;
  assignedPsychologist?: number;
  sortBy?: "firstName" | "lastName" | "nuControl" | "email" | "registeredDate";
  sortOrder?: "asc" | "desc";
}): Promise<PatientPaginatedResponse> {
  try {
    // Validar y aplicar valores por defecto
    const validatedParams = paginationSchema.parse({
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
      search: params?.search || undefined,
      activeOnly: params?.activeOnly || false,
      assignedPsychologist: params?.assignedPsychologist || undefined,
      sortBy: params?.sortBy || "registeredDate",
      sortOrder: params?.sortOrder || "desc",
    });

    const {
      page,
      pageSize,
      search,
      activeOnly,
      assignedPsychologist,
      sortBy,
      sortOrder,
    } = validatedParams;

    // Calcular skip para paginación
    const skip = (page - 1) * pageSize;

    // Construir condiciones de búsqueda
    const whereConditions: {
      active?: boolean;
      assignedPsychologist?: number | null;
      OR?: Array<{
        firstName?: { contains: string; mode: "insensitive" };
        lastName?: { contains: string; mode: "insensitive" };
        nuControl?: { contains: string; mode: "insensitive" };
        email?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    // Filtrar solo activos si se solicita
    if (activeOnly) {
      whereConditions.active = true;
    }

    // Filtrar por psicólogo asignado si se especifica
    if (assignedPsychologist !== undefined) {
      whereConditions.assignedPsychologist = assignedPsychologist;
    }

    // Búsqueda por texto (firstName, lastName, nuControl, email)
    if (search && search.trim() !== "") {
      whereConditions.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { nuControl: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Obtener total de registros para paginación
    const totalItems = await prisma.patient.count({
      where: whereConditions,
    });

    // Obtener registros paginados
    const patients = await prisma.patient.findMany({
      where: whereConditions,
      skip,
      take: pageSize,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        psychologist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
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
        patients: patients.map((patient) => ({
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          nuControl: patient.nuControl,
          email: patient.email,
          registeredDate: patient.registeredDate,
          active: patient.active,
          assignedPsychologist: patient.assignedPsychologist,
          psychologist: patient.psychologist,
          _count: patient._count,
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
    console.error("Error en getPaginatedPatients:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: `Parámetros de paginación inválidos: ${error.issues[0].message}`,
      };
    }

    return {
      success: false,
      message: "Error al obtener los pacientes",
    };
  }
}

/**
 * Action simplificada para obtener pacientes paginados desde FormData
 * Útil para usar directamente en formularios de búsqueda
 * @param formData - Datos del formulario
 * @returns Lista paginada de pacientes
 */
export async function searchPatients(
  formData: FormData
): Promise<PatientPaginatedResponse> {
  const page = formData.get("page") ? Number(formData.get("page")) : 1;
  const pageSize = formData.get("pageSize")
    ? Number(formData.get("pageSize"))
    : 10;
  const search = formData.get("search")?.toString() || undefined;
  const activeOnly = formData.get("activeOnly") === "true";
  const assignedPsychologist = formData.get("assignedPsychologist")
    ? Number(formData.get("assignedPsychologist"))
    : undefined;
  const sortBy = (formData.get("sortBy")?.toString() || "registeredDate") as
    | "email"
    | "registeredDate";
  const sortOrder = (formData.get("sortOrder")?.toString() || "desc") as
    | "asc"
    | "desc";

  return getPaginatedPatients({
    page,
    pageSize,
    search,
    activeOnly,
    assignedPsychologist,
    sortBy,
    sortOrder,
  });
}
