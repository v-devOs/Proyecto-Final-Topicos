"use server";

import { z } from "zod";
import prisma from "@/app/lib/prisma";

// Schema de validación
const deleteStaffSchema = z.object({
  id: z.number().positive("ID inválido"),
  forceDelete: z.boolean().optional().default(false), // true = hard delete, false = soft delete
});

interface ActionResponse {
  success: boolean;
  message: string;
  deletionType?: "soft" | "hard";
  relationships?: {
    schedules: number;
    appointments: number;
    patients: number;
  };
}

export async function deleteStaffAction(
  staffId: number,
  forceDelete: boolean = false
): Promise<ActionResponse> {
  try {
    console.log("🗑️ Iniciando eliminación de staff:", {
      staffId,
      forceDelete,
    });

    // Validar datos
    const validatedData = deleteStaffSchema.parse({
      id: staffId,
      forceDelete,
    });

    console.log("✅ Datos validados");

    // Verificar que el staff existe y obtener sus relaciones
    const staff = await prisma.staff.findUnique({
      where: { id: validatedData.id },
      include: {
        _count: {
          select: {
            schedules: true,
            appointments: true,
            assignedPatients: true,
          },
        },
      },
    });

    if (!staff) {
      console.log("❌ Staff no encontrado");
      return {
        success: false,
        message: "Miembro del staff no encontrado",
      };
    }

    console.log("👤 Staff encontrado:", {
      id: staff.id,
      email: staff.email,
      schedules: staff._count.schedules,
      appointments: staff._count.appointments,
      patients: staff._count.assignedPatients,
    });

    // Determinar si tiene relaciones
    const hasRelationships =
      staff._count.schedules > 0 ||
      staff._count.appointments > 0 ||
      staff._count.assignedPatients > 0;

    if (hasRelationships && !forceDelete) {
      // Soft delete: desactivar el staff
      console.log("⚠️ Staff tiene relaciones, realizando soft delete...");

      await prisma.staff.update({
        where: { id: validatedData.id },
        data: { active: false },
      });

      console.log("✅ Staff desactivado (soft delete)");

      return {
        success: true,
        message: `Miembro del staff desactivado. Tiene datos históricos asociados`,
        deletionType: "soft",
        relationships: {
          schedules: staff._count.schedules,
          appointments: staff._count.appointments,
          patients: staff._count.assignedPatients,
        },
      };
    }

    if (hasRelationships && forceDelete) {
      // No permitir eliminación forzada si hay relaciones
      console.log(
        "⛔ No se puede eliminar permanentemente, tiene datos asociados"
      );

      return {
        success: false,
        message: `No se puede eliminar permanentemente. El miembro del staff tiene registros históricos asociados (${staff._count.schedules} horarios, ${staff._count.appointments} citas, ${staff._count.assignedPatients} pacientes). Solo puede ser desactivado`,
        relationships: {
          schedules: staff._count.schedules,
          appointments: staff._count.appointments,
          patients: staff._count.assignedPatients,
        },
      };
    }

    // Hard delete: eliminar completamente
    console.log("🗑️ Staff sin relaciones, realizando hard delete...");

    await prisma.staff.delete({
      where: { id: validatedData.id },
    });

    console.log("✅ Staff eliminado permanentemente");

    return {
      success: true,
      message: "Miembro del staff eliminado permanentemente",
      deletionType: "hard",
    };
  } catch (error) {
    console.error("💥 Error en deleteStaffAction:", error);

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
            "No se puede eliminar el miembro del staff porque tiene registros asociados",
        };
      }

      // Error de registro no encontrado
      if (error.message.includes("Record to delete does not exist")) {
        return {
          success: false,
          message: "Miembro del staff no encontrado",
        };
      }
    }

    return {
      success: false,
      message: "Error al eliminar miembro del staff. Intente nuevamente",
    };
  }
}
