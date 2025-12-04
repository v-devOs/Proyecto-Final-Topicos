"use server";

import { z } from "zod";
import prisma from "@/app/lib/prisma";

// Schema de validación
const deleteAdminSchema = z.object({
  id: z.number().positive("ID inválido"),
  forceDelete: z.boolean().optional().default(false), // true = hard delete, false = soft delete
});

interface ActionResponse {
  success: boolean;
  message: string;
  deletionType?: "soft" | "hard";
}

export async function deleteAdminAction(
  adminId: number,
  forceDelete: boolean = false
): Promise<ActionResponse> {
  try {
    console.log("🗑️ Iniciando eliminación de admin:", {
      adminId,
      forceDelete,
    });

    // Validar datos
    const validatedData = deleteAdminSchema.parse({
      id: adminId,
      forceDelete,
    });

    console.log("✅ Datos validados");

    // Verificar que el admin existe
    const admin = await prisma.admin.findUnique({
      where: { id: validatedData.id },
      include: {
        _count: {
          select: {
            createdStaff: true,
          },
        },
      },
    });

    if (!admin) {
      console.log("❌ Admin no encontrado");
      return {
        success: false,
        message: "Administrador no encontrado",
      };
    }

    console.log("👤 Admin encontrado:", {
      id: admin.id,
      email: admin.email,
      staffCreados: admin._count.createdStaff,
    });

    // Determinar tipo de eliminación
    const hasRelationships = admin._count.createdStaff > 0;

    if (hasRelationships && !forceDelete) {
      // Soft delete: desactivar el admin
      console.log("⚠️ Admin tiene staff creados, realizando soft delete...");

      await prisma.admin.update({
        where: { id: validatedData.id },
        data: { active: false },
      });

      console.log("✅ Admin desactivado (soft delete)");

      return {
        success: true,
        message: `Administrador desactivado. Tiene ${admin._count.createdStaff} miembro(s) de staff asociados`,
        deletionType: "soft",
      };
    }

    if (hasRelationships && forceDelete) {
      // No permitir eliminación forzada si hay relaciones
      console.log(
        "⛔ No se puede eliminar permanentemente, tiene staff asociado"
      );

      return {
        success: false,
        message: `No se puede eliminar permanentemente. El administrador tiene ${admin._count.createdStaff} miembro(s) de staff asociados. Solo puede ser desactivado`,
      };
    }

    // Hard delete: eliminar completamente
    console.log("🗑️ Admin sin relaciones, realizando hard delete...");

    await prisma.admin.delete({
      where: { id: validatedData.id },
    });

    console.log("✅ Admin eliminado permanentemente");

    return {
      success: true,
      message: "Administrador eliminado permanentemente",
      deletionType: "hard",
    };
  } catch (error) {
    console.error("💥 Error en deleteAdminAction:", error);

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
            "No se puede eliminar el administrador porque tiene registros asociados",
        };
      }

      // Error de registro no encontrado
      if (error.message.includes("Record to delete does not exist")) {
        return {
          success: false,
          message: "Administrador no encontrado",
        };
      }
    }

    return {
      success: false,
      message: "Error al eliminar administrador. Intente nuevamente",
    };
  }
}
