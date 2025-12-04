"use server";

import { z } from "zod";
import prisma from "@/app/lib/prisma";

// Schema de validación para crear o actualizar schedule
const scheduleSchema = z
  .object({
    id: z.number().optional(), // Si existe ID, es actualización
    staffId: z.number().positive("El ID del staff es requerido"),
    dayOfWeek: z
      .number()
      .int()
      .min(0, "El día de la semana debe ser entre 0 (Domingo) y 6 (Sábado)")
      .max(6, "El día de la semana debe ser entre 0 (Domingo) y 6 (Sábado)"),
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
    available: z.boolean().optional().default(true),
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

type ScheduleInput = z.infer<typeof scheduleSchema>;

interface ActionResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    staffId: number;
    dayOfWeek: number;
    startTime: Date;
    endTime: Date;
    available: boolean;
  };
}

export async function createOrUpdateScheduleAction(
  scheduleData: ScheduleInput
): Promise<ActionResponse> {
  try {
    console.log("📝 Datos recibidos para horario:", {
      id: scheduleData.id,
      staffId: scheduleData.staffId,
      dayOfWeek: scheduleData.dayOfWeek,
      startTime: scheduleData.startTime,
      endTime: scheduleData.endTime,
      available: scheduleData.available,
    });

    // Validar datos con Zod
    const validatedData = scheduleSchema.parse(scheduleData);
    console.log("✅ Datos validados correctamente");

    const isUpdate = !!validatedData.id;

    // Si es actualización, validar que el horario existe
    if (isUpdate) {
      const existingSchedule = await prisma.schedule.findUnique({
        where: { id: validatedData.id },
      });

      if (!existingSchedule) {
        console.log("❌ Horario no encontrado para actualización");
        return {
          success: false,
          message: "Horario no encontrado",
        };
      }
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

    // Convertir strings de tiempo a objetos Date (solo la parte de tiempo)
    const startTimeDate = new Date(`1970-01-01T${validatedData.startTime}:00`);
    const endTimeDate = new Date(`1970-01-01T${validatedData.endTime}:00`);

    // Verificar conflictos de horario (mismo staff, mismo día, solapamiento de horas)
    if (!isUpdate) {
      const conflictingSchedule = await prisma.schedule.findFirst({
        where: {
          staffId: validatedData.staffId,
          dayOfWeek: validatedData.dayOfWeek,
          OR: [
            {
              // El nuevo horario empieza durante un horario existente
              AND: [
                { startTime: { lte: startTimeDate } },
                { endTime: { gt: startTimeDate } },
              ],
            },
            {
              // El nuevo horario termina durante un horario existente
              AND: [
                { startTime: { lt: endTimeDate } },
                { endTime: { gte: endTimeDate } },
              ],
            },
            {
              // El nuevo horario contiene un horario existente
              AND: [
                { startTime: { gte: startTimeDate } },
                { endTime: { lte: endTimeDate } },
              ],
            },
          ],
        },
      });

      if (conflictingSchedule) {
        console.log("⚠️ Conflicto de horario detectado");
        return {
          success: false,
          message: `Ya existe un horario para este día que se solapa con el horario especificado`,
        };
      }
    } else {
      // En actualización, verificar conflictos excluyendo el horario actual
      const conflictingSchedule = await prisma.schedule.findFirst({
        where: {
          staffId: validatedData.staffId,
          dayOfWeek: validatedData.dayOfWeek,
          NOT: { id: validatedData.id },
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

      if (conflictingSchedule) {
        console.log("⚠️ Conflicto de horario detectado en actualización");
        return {
          success: false,
          message: `El nuevo horario se solapa con otro horario existente`,
        };
      }
    }

    // Preparar datos para upsert
    const dataToUpsert = {
      staffId: validatedData.staffId,
      dayOfWeek: validatedData.dayOfWeek,
      startTime: startTimeDate,
      endTime: endTimeDate,
      available: validatedData.available ?? true,
    };

    // Usar upsert de Prisma
    console.log(
      isUpdate ? "📝 Actualizando horario..." : "🆕 Creando nuevo horario..."
    );

    const schedule = await prisma.schedule.upsert({
      where: {
        id: validatedData.id || -1, // Si no hay ID, usar -1 para forzar creación
      },
      create: dataToUpsert,
      update: dataToUpsert,
      select: {
        id: true,
        staffId: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        available: true,
        staff: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    console.log("✅ Horario guardado exitosamente:", {
      id: schedule.id,
      staff: `${schedule.staff.firstName} ${schedule.staff.lastName}`,
      dayOfWeek: schedule.dayOfWeek,
    });

    return {
      success: true,
      message: isUpdate
        ? "Horario actualizado exitosamente"
        : "Horario creado exitosamente",
      data: {
        id: schedule.id,
        staffId: schedule.staffId,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        available: schedule.available,
      },
    };
  } catch (error) {
    console.error("💥 Error en createOrUpdateScheduleAction:", error);

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
            "Ya existe un horario con esta combinación de staff, día y hora",
        };
      }

      if (error.message.includes("Foreign key constraint")) {
        return {
          success: false,
          message: "Error de referencia: verifica que el staff exista",
        };
      }
    }

    return {
      success: false,
      message: "Error al procesar la solicitud. Intente nuevamente",
    };
  }
}
