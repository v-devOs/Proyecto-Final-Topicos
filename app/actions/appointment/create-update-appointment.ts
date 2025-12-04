"use server";

import { z } from "zod";
import prisma from "@/app/lib/prisma";

// Schema de validación para crear o actualizar appointment
const appointmentSchema = z
  .object({
    id: z.number().optional(), // Si existe ID, es actualización
    patientId: z.number().positive("El ID del paciente es requerido"),
    staffId: z.number().positive("El ID del staff es requerido"),
    appointmentDate: z
      .string()
      .or(z.date())
      .transform((val) => {
        if (typeof val === "string") {
          return new Date(val);
        }
        return val;
      }),
    startTime: z
      .string()
      .regex(
        /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/,
        "Formato de hora inválido (HH:MM)"
      ),
    endTime: z
      .string()
      .regex(
        /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/,
        "Formato de hora inválido (HH:MM)"
      ),
    status: z
      .enum(["pending", "confirmed", "completed", "cancelled", "no_show"])
      .default("pending"),
    consultationType: z.string().max(50).optional().nullable(),
    notes: z.string().optional().nullable(),
    consultationRoomId: z.number().positive().optional().nullable(),
    createdBy: z.number().positive().optional().nullable(),
  })
  .refine(
    (data) => {
      // Validar que endTime sea después de startTime
      const start = data.startTime.split(":").map(Number);
      const end = data.endTime.split(":").map(Number);
      const startMinutes = start[0] * 60 + start[1];
      const endMinutes = end[0] * 60 + end[1];
      return endMinutes > startMinutes;
    },
    {
      message: "La hora de fin debe ser posterior a la hora de inicio",
      path: ["endTime"],
    }
  );

type AppointmentInput = z.infer<typeof appointmentSchema>;

interface ActionResponse {
  success: boolean;
  message: string;
  data?: {
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
  };
}

export async function createOrUpdateAppointmentAction(
  appointmentData: AppointmentInput
): Promise<ActionResponse> {
  try {
    console.log("📝 Datos recibidos para cita:", {
      id: appointmentData.id,
      patientId: appointmentData.patientId,
      staffId: appointmentData.staffId,
      appointmentDate: appointmentData.appointmentDate,
      startTime: appointmentData.startTime,
      endTime: appointmentData.endTime,
      status: appointmentData.status,
    });

    // Validar datos con Zod
    const validatedData = appointmentSchema.parse(appointmentData);
    console.log("✅ Datos validados correctamente");

    const isUpdate = !!validatedData.id;

    // Si es actualización, validar que la cita existe
    if (isUpdate) {
      const existingAppointment = await prisma.appointment.findUnique({
        where: { id: validatedData.id },
      });

      if (!existingAppointment) {
        console.log("❌ Cita no encontrada para actualización");
        return {
          success: false,
          message: "Cita no encontrada",
        };
      }
    }

    // Verificar que el paciente existe y está activo
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId },
    });

    if (!patient) {
      console.log("⚠️ Paciente no encontrado:", validatedData.patientId);
      return {
        success: false,
        message: "El paciente especificado no existe",
      };
    }

    if (!patient.active) {
      console.log("⚠️ Paciente inactivo:", validatedData.patientId);
      return {
        success: false,
        message: "El paciente especificado está inactivo",
      };
    }

    // Verificar que el staff existe y está activo
    const staff = await prisma.staff.findUnique({
      where: { id: validatedData.staffId },
    });

    if (!staff) {
      console.log("⚠️ Staff no encontrado:", validatedData.staffId);
      return {
        success: false,
        message: "El miembro del staff especificado no existe",
      };
    }

    if (!staff.active) {
      console.log("⚠️ Staff inactivo:", validatedData.staffId);
      return {
        success: false,
        message: "El miembro del staff especificado está inactivo",
      };
    }

    // Verificar que el consultorio existe y está activo si se proporciona
    if (validatedData.consultationRoomId) {
      const consultationRoom = await prisma.consultationRoom.findUnique({
        where: { id: validatedData.consultationRoomId },
      });

      if (!consultationRoom) {
        console.log(
          "⚠️ Consultorio no encontrado:",
          validatedData.consultationRoomId
        );
        return {
          success: false,
          message: "El consultorio especificado no existe",
        };
      }

      if (!consultationRoom.active) {
        console.log(
          "⚠️ Consultorio inactivo:",
          validatedData.consultationRoomId
        );
        return {
          success: false,
          message: "El consultorio especificado está inactivo",
        };
      }
    }

    // Convertir strings de tiempo a objetos Date
    const startTimeDate = new Date(`1970-01-01T${validatedData.startTime}:00`);
    const endTimeDate = new Date(`1970-01-01T${validatedData.endTime}:00`);

    // Verificar disponibilidad del staff en esa fecha y hora
    const dayOfWeek = validatedData.appointmentDate.getDay();

    const staffSchedule = await prisma.schedule.findFirst({
      where: {
        staffId: validatedData.staffId,
        dayOfWeek: dayOfWeek,
        available: true,
        startTime: { lte: startTimeDate },
        endTime: { gte: endTimeDate },
      },
    });

    if (!staffSchedule) {
      console.log(
        "⚠️ Staff no disponible en ese horario:",
        validatedData.staffId
      );
      return {
        success: false,
        message:
          "El miembro del staff no tiene disponibilidad en ese día y horario",
      };
    }

    // Verificar conflictos de citas para el staff
    if (!isUpdate) {
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          staffId: validatedData.staffId,
          appointmentDate: validatedData.appointmentDate,
          status: {
            in: ["pending", "confirmed"],
          },
          OR: [
            {
              // La nueva cita empieza durante una cita existente
              AND: [
                { startTime: { lte: startTimeDate } },
                { endTime: { gt: startTimeDate } },
              ],
            },
            {
              // La nueva cita termina durante una cita existente
              AND: [
                { startTime: { lt: endTimeDate } },
                { endTime: { gte: endTimeDate } },
              ],
            },
            {
              // La nueva cita contiene una cita existente
              AND: [
                { startTime: { gte: startTimeDate } },
                { endTime: { lte: endTimeDate } },
              ],
            },
          ],
        },
      });

      if (conflictingAppointment) {
        console.log("⚠️ Conflicto de cita detectado");
        return {
          success: false,
          message: `El staff ya tiene una cita confirmada o pendiente en ese horario`,
        };
      }
    } else {
      // En actualización, verificar conflictos excluyendo la cita actual
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          staffId: validatedData.staffId,
          appointmentDate: validatedData.appointmentDate,
          NOT: { id: validatedData.id },
          status: {
            in: ["pending", "confirmed"],
          },
          OR: [
            {
              AND: [
                { startTime: { lte: startTimeDate } },
                { endTime: { gt: startTimeDate } },
              ],
            },
            {
              AND: [
                { startTime: { lt: endTimeDate } },
                { endTime: { gte: endTimeDate } },
              ],
            },
            {
              AND: [
                { startTime: { gte: startTimeDate } },
                { endTime: { lte: endTimeDate } },
              ],
            },
          ],
        },
      });

      if (conflictingAppointment) {
        console.log("⚠️ Conflicto de cita detectado en actualización");
        return {
          success: false,
          message: `La nueva hora se solapa con otra cita existente`,
        };
      }
    }

    // Preparar datos para upsert
    const dataToUpsert = {
      patientId: validatedData.patientId,
      staffId: validatedData.staffId,
      appointmentDate: validatedData.appointmentDate,
      startTime: startTimeDate,
      endTime: endTimeDate,
      status: validatedData.status,
      consultationType: validatedData.consultationType ?? null,
      notes: validatedData.notes ?? null,
      consultationRoomId: validatedData.consultationRoomId ?? null,
      createdBy: validatedData.createdBy ?? null,
    };

    // Usar upsert de Prisma
    console.log(
      isUpdate ? "📝 Actualizando cita..." : "🆕 Creando nueva cita..."
    );

    const appointment = await prisma.appointment.upsert({
      where: {
        id: validatedData.id || -1, // Si no hay ID, usar -1 para forzar creación
      },
      create: dataToUpsert,
      update: dataToUpsert,
      select: {
        id: true,
        patientId: true,
        staffId: true,
        appointmentDate: true,
        startTime: true,
        endTime: true,
        status: true,
        consultationType: true,
        notes: true,
        consultationRoomId: true,
        createdAt: true,
        patient: {
          select: {
            email: true,
          },
        },
        staff: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        consultationRoom: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    console.log("✅ Cita guardada exitosamente:", {
      id: appointment.id,
      patient: appointment.patient.email,
      staff: `${appointment.staff.firstName} ${appointment.staff.lastName}`,
      date: appointment.appointmentDate,
    });

    return {
      success: true,
      message: isUpdate
        ? "Cita actualizada exitosamente"
        : "Cita creada exitosamente",
      data: {
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
      },
    };
  } catch (error) {
    console.error("💥 Error en createOrUpdateAppointmentAction:", error);

    // Manejo de errores de validación de Zod
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        message: firstError.message,
      };
    }

    // Manejo de errores de Prisma
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return {
          success: false,
          message:
            "Ya existe una cita con esta combinación de staff, fecha y hora",
        };
      }

      if (error.message.includes("Foreign key constraint")) {
        return {
          success: false,
          message:
            "Error de referencia: verifica que el paciente, staff y/o consultorio existan",
        };
      }
    }

    return {
      success: false,
      message: "Error al procesar la solicitud. Intente nuevamente",
    };
  }
}
