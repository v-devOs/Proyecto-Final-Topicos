"use server";

import { z } from "zod";
import prisma from "@/app/lib/prisma";

// Schema de validación
const deleteScheduleSchema = z.object({
  id: z.number().positive("ID inválido"),
});

interface ActionResponse {
  success: boolean;
  message: string;
}

export async function deleteScheduleAction(
  scheduleId: number
): Promise<ActionResponse> {
  try {
    console.log("🗑️ Iniciando eliminación de horario:", {
      scheduleId,
    });

    // Validar datos
    const validatedData = deleteScheduleSchema.parse({
      id: scheduleId,
    });

    console.log("✅ Datos validados");

    // Verificar que el horario existe
    const schedule = await prisma.schedule.findUnique({
      where: { id: validatedData.id },
      include: {
        staff: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!schedule) {
      console.log("❌ Horario no encontrado");
      return {
        success: false,
        message: "Horario no encontrado",
      };
    }

    console.log("📅 Horario encontrado:", {
      id: schedule.id,
      staff: `${schedule.staff.firstName} ${schedule.staff.lastName}`,
      dayOfWeek: schedule.dayOfWeek,
    });

    // Los schedules no tienen relaciones que impidan su eliminación
    // Se eliminan directamente (hard delete)
    console.log("🗑️ Eliminando horario...");

    await prisma.schedule.delete({
      where: { id: validatedData.id },
    });

    console.log("✅ Horario eliminado exitosamente");

    return {
      success: true,
      message: "Horario eliminado exitosamente",
    };
  } catch (error) {
    console.error("💥 Error en deleteScheduleAction:", error);

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
      // Error de foreign key constraint
      if (
        error.message.includes("Foreign key constraint") ||
        error.message.includes("foreign key")
      ) {
        return {
          success: false,
          message:
            "No se puede eliminar el horario porque tiene registros asociados",
        };
      }

      // Error de registro no encontrado
      if (error.message.includes("Record to delete does not exist")) {
        return {
          success: false,
          message: "Horario no encontrado",
        };
      }
    }

    return {
      success: false,
      message: "Error al eliminar horario. Intente nuevamente",
    };
  }
}
