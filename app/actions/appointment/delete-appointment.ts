"use server";

import { z } from "zod";
import prisma from "@/app/lib/prisma";

// Schema de validación
const deleteAppointmentSchema = z.object({
  id: z.number().positive("ID inválido"),
});

interface ActionResponse {
  success: boolean;
  message: string;
}

export async function deleteAppointmentAction(
  appointmentId: number
): Promise<ActionResponse> {
  try {
    console.log("🗑️ Iniciando eliminación de cita:", {
      appointmentId,
    });

    // Validar datos
    const validatedData = deleteAppointmentSchema.parse({
      id: appointmentId,
    });

    console.log("✅ Datos validados");

    // Verificar que la cita existe
    const appointment = await prisma.appointment.findUnique({
      where: { id: validatedData.id },
      include: {
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
      },
    });

    if (!appointment) {
      console.log("❌ Cita no encontrada");
      return {
        success: false,
        message: "Cita no encontrada",
      };
    }

    console.log("📅 Cita encontrada:", {
      id: appointment.id,
      patient: appointment.patient.email,
      staff: `${appointment.staff.firstName} ${appointment.staff.lastName}`,
      date: appointment.appointmentDate,
      status: appointment.status,
    });

    // Verificar si la cita ya fue completada
    if (appointment.status === "completed") {
      console.log("⚠️ Advertencia: Eliminando cita completada");
      // Permitir eliminación pero con advertencia en el mensaje
    }

    // Los appointments pueden eliminarse directamente (hard delete)
    // No hay dependencias que impidan su eliminación
    console.log("🗑️ Eliminando cita...");

    await prisma.appointment.delete({
      where: { id: validatedData.id },
    });

    console.log("✅ Cita eliminada exitosamente");

    return {
      success: true,
      message:
        appointment.status === "completed"
          ? "Cita completada eliminada exitosamente"
          : "Cita eliminada exitosamente",
    };
  } catch (error) {
    console.error("💥 Error en deleteAppointmentAction:", error);

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
            "No se puede eliminar la cita porque tiene registros asociados",
        };
      }

      // Error de registro no encontrado
      if (error.message.includes("Record to delete does not exist")) {
        return {
          success: false,
          message: "Cita no encontrada",
        };
      }
    }

    return {
      success: false,
      message: "Error al eliminar cita. Intente nuevamente",
    };
  }
}

/**
 * Action para cancelar una cita (cambiar status a cancelled)
 * Alternativa más suave que eliminar la cita
 */
export async function cancelAppointmentAction(
  appointmentId: number,
  cancelReason?: string
): Promise<ActionResponse> {
  try {
    console.log("🚫 Iniciando cancelación de cita:", {
      appointmentId,
      cancelReason,
    });

    // Validar datos
    const validatedData = deleteAppointmentSchema.parse({
      id: appointmentId,
    });

    // Verificar que la cita existe
    const appointment = await prisma.appointment.findUnique({
      where: { id: validatedData.id },
    });

    if (!appointment) {
      console.log("❌ Cita no encontrada");
      return {
        success: false,
        message: "Cita no encontrada",
      };
    }

    // Verificar que la cita no esté ya completada
    if (appointment.status === "completed") {
      console.log("⚠️ No se puede cancelar una cita completada");
      return {
        success: false,
        message: "No se puede cancelar una cita que ya fue completada",
      };
    }

    // Verificar que la cita no esté ya cancelada
    if (appointment.status === "cancelled") {
      console.log("⚠️ La cita ya está cancelada");
      return {
        success: false,
        message: "La cita ya está cancelada",
      };
    }

    // Actualizar status a cancelled y agregar nota si se proporciona
    const updatedNotes = cancelReason
      ? `${appointment.notes || ""}\n[CANCELADA]: ${cancelReason}`.trim()
      : appointment.notes;

    await prisma.appointment.update({
      where: { id: validatedData.id },
      data: {
        status: "cancelled",
        notes: updatedNotes,
      },
    });

    console.log("✅ Cita cancelada exitosamente");

    return {
      success: true,
      message: "Cita cancelada exitosamente",
    };
  } catch (error) {
    console.error("💥 Error en cancelAppointmentAction:", error);

    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        message: firstError.message,
      };
    }

    return {
      success: false,
      message: "Error al cancelar cita. Intente nuevamente",
    };
  }
}
