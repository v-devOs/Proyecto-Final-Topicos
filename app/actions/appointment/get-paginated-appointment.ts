"use server";

import { z } from "zod";
import prisma from "@/app/lib/prisma";

// Schema de validación para paginación
const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().min(1).max(100).default(10),
  patientId: z.number().positive().optional(),
  staffId: z.number().positive().optional(),
  status: z
    .enum(["pending", "confirmed", "completed", "cancelled", "no_show"])
    .optional(),
  dateFrom: z
    .string()
    .or(z.date())
    .transform((val) => {
      if (typeof val === "string") {
        return new Date(val);
      }
      return val;
    })
    .optional(),
  dateTo: z
    .string()
    .or(z.date())
    .transform((val) => {
      if (typeof val === "string") {
        return new Date(val);
      }
      return val;
    })
    .optional(),
  sortBy: z
    .enum(["appointmentDate", "startTime", "status"])
    .default("appointmentDate"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

type AppointmentPaginatedResponse = {
  success: boolean;
  message?: string;
  data?: {
    appointments: Array<{
      id: number;
      patientId: number;
      staffId: number;
      appointmentDate: Date;
      startTime: Date;
      endTime: Date;
      status: string;
      consultationType: string | null;
      notes: string | null;
      consultationRoomId: number | null;
      createdAt: Date;
      patient: {
        id: number;
        email: string;
      };
      staff: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
      };
      consultationRoom: {
        id: number;
        code: string;
        name: string;
        location: string;
      } | null;
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
 * Action para obtener citas de forma paginada
 * @param params - Parámetros de paginación, búsqueda y ordenamiento
 * @returns Lista paginada de citas
 */
export async function getPaginatedAppointments(params?: {
  page?: number;
  pageSize?: number;
  patientId?: number;
  staffId?: number;
  status?: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  dateFrom?: string | Date;
  dateTo?: string | Date;
  sortBy?: "appointmentDate" | "startTime" | "status";
  sortOrder?: "asc" | "desc";
}): Promise<AppointmentPaginatedResponse> {
  try {
    // Validar y aplicar valores por defecto
    const validatedParams = paginationSchema.parse({
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
      patientId: params?.patientId || undefined,
      staffId: params?.staffId || undefined,
      status: params?.status || undefined,
      dateFrom: params?.dateFrom || undefined,
      dateTo: params?.dateTo || undefined,
      sortBy: params?.sortBy || "appointmentDate",
      sortOrder: params?.sortOrder || "asc",
    });

    const {
      page,
      pageSize,
      patientId,
      staffId,
      status,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = validatedParams;

    // Calcular skip para paginación
    const skip = (page - 1) * pageSize;

    // Construir condiciones de búsqueda
    const whereConditions: {
      patientId?: number;
      staffId?: number;
      status?: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
      appointmentDate?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    // Filtrar por paciente si se especifica
    if (patientId !== undefined) {
      whereConditions.patientId = patientId;
    }

    // Filtrar por staff si se especifica
    if (staffId !== undefined) {
      whereConditions.staffId = staffId;
    }

    // Filtrar por status si se especifica
    if (status !== undefined) {
      whereConditions.status = status;
    }

    // Filtrar por rango de fechas
    if (dateFrom || dateTo) {
      whereConditions.appointmentDate = {};
      if (dateFrom) {
        whereConditions.appointmentDate.gte = dateFrom;
      }
      if (dateTo) {
        whereConditions.appointmentDate.lte = dateTo;
      }
    }

    // Obtener total de registros para paginación
    const totalItems = await prisma.appointment.count({
      where: whereConditions,
    });

    // Obtener registros paginados
    const appointments = await prisma.appointment.findMany({
      where: whereConditions,
      skip,
      take: pageSize,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        patient: {
          select: {
            id: true,
            email: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        consultationRoom: {
          select: {
            id: true,
            code: true,
            name: true,
            location: true,
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
        appointments: appointments.map((appointment) => ({
          id: appointment.id,
          patientId: appointment.patientId,
          staffId: appointment.staffId,
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          status: appointment.status,
          consultationType: appointment.consultationType,
          notes: appointment.notes,
          consultationRoomId: appointment.consultationRoomId,
          createdAt: appointment.createdAt,
          patient: {
            id: appointment.patient.id,
            email: appointment.patient.email,
          },
          staff: {
            id: appointment.staff.id,
            firstName: appointment.staff.firstName,
            lastName: appointment.staff.lastName,
            email: appointment.staff.email,
            phone: appointment.staff.phone,
          },
          consultationRoom: appointment.consultationRoom
            ? {
                id: appointment.consultationRoom.id,
                code: appointment.consultationRoom.code,
                name: appointment.consultationRoom.name,
                location: appointment.consultationRoom.location,
              }
            : null,
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
    console.error("Error en getPaginatedAppointments:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: `Parámetros de paginación inválidos: ${error.issues[0].message}`,
      };
    }

    return {
      success: false,
      message: "Error al obtener las citas",
    };
  }
}

/**
 * Action simplificada para obtener citas paginadas desde FormData
 * Útil para usar directamente en formularios de búsqueda
 * @param formData - Datos del formulario
 * @returns Lista paginada de citas
 */
export async function searchAppointments(
  formData: FormData
): Promise<AppointmentPaginatedResponse> {
  const page = formData.get("page") ? Number(formData.get("page")) : 1;
  const pageSize = formData.get("pageSize")
    ? Number(formData.get("pageSize"))
    : 10;
  const patientId = formData.get("patientId")
    ? Number(formData.get("patientId"))
    : undefined;
  const staffId = formData.get("staffId")
    ? Number(formData.get("staffId"))
    : undefined;
  const status = formData.get("status")?.toString() as
    | "pending"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "no_show"
    | undefined;
  const dateFrom = formData.get("dateFrom")?.toString() || undefined;
  const dateTo = formData.get("dateTo")?.toString() || undefined;
  const sortBy = (formData.get("sortBy")?.toString() || "appointmentDate") as
    | "appointmentDate"
    | "startTime"
    | "status";
  const sortOrder = (formData.get("sortOrder")?.toString() || "asc") as
    | "asc"
    | "desc";

  return getPaginatedAppointments({
    page,
    pageSize,
    patientId,
    staffId,
    status,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
  });
}

/**
 * Action para obtener citas del día actual
 * @param staffId - Opcional: Filtrar por staff específico
 * @param status - Opcional: Filtrar por status específico
 * @returns Citas del día actual
 */
export async function getTodayAppointments(
  staffId?: number,
  status?: "pending" | "confirmed" | "completed" | "cancelled" | "no_show"
): Promise<AppointmentPaginatedResponse> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getPaginatedAppointments({
    staffId,
    status,
    dateFrom: today,
    dateTo: tomorrow,
    sortBy: "startTime",
    sortOrder: "asc",
    pageSize: 100, // Mostrar todas las citas del día
  });
}

/**
 * Action para obtener próximas citas de un paciente
 * @param patientId - ID del paciente
 * @param limit - Número máximo de citas a retornar
 * @returns Próximas citas del paciente
 */
export async function getUpcomingPatientAppointments(
  patientId: number,
  limit: number = 5
): Promise<AppointmentPaginatedResponse> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return getPaginatedAppointments({
    patientId,
    dateFrom: today,
    status: undefined, // Todas las citas futuras (excepto canceladas si filtras)
    sortBy: "appointmentDate",
    sortOrder: "asc",
    pageSize: limit,
  });
}

/**
 * Action para obtener próximas citas de un staff
 * @param staffId - ID del staff
 * @param limit - Número máximo de citas a retornar
 * @returns Próximas citas del staff
 */
export async function getUpcomingStaffAppointments(
  staffId: number,
  limit: number = 10
): Promise<AppointmentPaginatedResponse> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return getPaginatedAppointments({
    staffId,
    dateFrom: today,
    sortBy: "appointmentDate",
    sortOrder: "asc",
    pageSize: limit,
  });
}
