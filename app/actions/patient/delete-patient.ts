"use server";

import { z } from "zod";
import prisma from "@/app/lib/prisma";

// Schema de validación
const deletePatientSchema = z.object({
  id: z.number().positive("ID inválido"),
  forceDelete: z.boolean().optional().default(false), // true = hard delete, false = soft delete
});

interface ActionResponse {
  success: boolean;
  message: string;
  deletionType?: "soft" | "hard";
  relationships?: {
    appointments: number;
  };
}

export async function deletePatientAction(
  patientId: number,
  forceDelete: boolean = false
): Promise<ActionResponse> {
  try {
    console.log("🗑️ Iniciando eliminación de paciente:", {
      patientId,
      forceDelete,
    });

    // Validar datos
    const validatedData = deletePatientSchema.parse({
      id: patientId,
      forceDelete,
    });

    console.log("✅ Datos validados");

    // Verificar que el paciente existe y obtener sus relaciones
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.id },
      include: {
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    if (!patient) {
      console.log("❌ Paciente no encontrado");
      return {
        success: false,
        message: "Paciente no encontrado",
      };
    }

    console.log("👤 Paciente encontrado:", {
      id: patient.id,
      email: patient.email,
      appointments: patient._count.appointments,
    });

    // Determinar si tiene relaciones
    const hasRelationships = patient._count.appointments > 0;

    if (hasRelationships && !forceDelete) {
      // Soft delete: desactivar el paciente
      console.log("⚠️ Paciente tiene citas, realizando soft delete...");

      await prisma.patient.update({
        where: { id: validatedData.id },
        data: { active: false },
      });

      console.log("✅ Paciente desactivado (soft delete)");

      return {
        success: true,
        message: `Paciente desactivado. Tiene ${patient._count.appointments} cita(s) asociada(s)`,
        deletionType: "soft",
        relationships: {
          appointments: patient._count.appointments,
        },
      };
    }

    if (hasRelationships && forceDelete) {
      // No permitir eliminación forzada si hay citas
      console.log(
        "⛔ No se puede eliminar permanentemente, tiene citas asociadas"
      );

      return {
        success: false,
        message: `No se puede eliminar permanentemente. El paciente tiene ${patient._count.appointments} cita(s) asociada(s). Solo puede ser desactivado`,
        relationships: {
          appointments: patient._count.appointments,
        },
      };
    }

    // Hard delete: eliminar completamente
    console.log("🗑️ Paciente sin relaciones, realizando hard delete...");

    await prisma.patient.delete({
      where: { id: validatedData.id },
    });

    console.log("✅ Paciente eliminado permanentemente");

    return {
      success: true,
      message: "Paciente eliminado permanentemente",
      deletionType: "hard",
    };
  } catch (error) {
    console.error("💥 Error en deletePatientAction:", error);

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
            "No se puede eliminar el paciente porque tiene registros asociados",
        };
      }

      // Error de registro no encontrado
      if (error.message.includes("Record to delete does not exist")) {
        return {
          success: false,
          message: "Paciente no encontrado",
        };
      }
    }

    return {
      success: false,
      message: "Error al eliminar paciente. Intente nuevamente",
    };
  }
}
