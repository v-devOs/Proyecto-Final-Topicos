"use server";

import prisma from "@/app/lib/prisma";

type DeleteConsultationRoomResponse = {
  success: boolean;
  message: string;
};

/**
 * Action para eliminar (soft delete o hard delete) un cuarto de consulta
 * Si tiene staff o citas asignadas, solo lo desactiva (soft delete)
 * Si no tiene relaciones, lo elimina permanentemente (hard delete)
 * @param id - ID del cuarto de consulta a eliminar
 * @returns Resultado de la operación
 */
export async function deleteConsultationRoom(
  id: number
): Promise<DeleteConsultationRoomResponse> {
  try {
    // Validar que el ID sea válido
    if (!id || id <= 0) {
      return {
        success: false,
        message: "ID de cuarto de consulta inválido",
      };
    }

    // Verificar que el cuarto existe y obtener información de relaciones
    const existingRoom = await prisma.consultationRoom.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            staff: true,
            appointments: true,
          },
        },
      },
    });

    if (!existingRoom) {
      return {
        success: false,
        message: "Cuarto de consulta no encontrado",
      };
    }

    // Verificar si tiene staff o citas asignadas
    const hasStaff = existingRoom._count.staff > 0;
    const hasAppointments = existingRoom._count.appointments > 0;

    if (hasStaff || hasAppointments) {
      // Soft delete: Solo desactivar si tiene relaciones
      await prisma.consultationRoom.update({
        where: { id },
        data: { active: false },
      });

      const relations = [];
      if (hasStaff) relations.push(`${existingRoom._count.staff} psicólogo(s)`);
      if (hasAppointments)
        relations.push(`${existingRoom._count.appointments} cita(s)`);

      return {
        success: true,
        message: `El cuarto de consulta ha sido desactivado porque tiene ${relations.join(
          " y "
        )} asignado(s). Los datos históricos se mantendrán.`,
      };
    }

    // Hard delete: Eliminar permanentemente si no tiene relaciones
    await prisma.consultationRoom.delete({
      where: { id },
    });

    return {
      success: true,
      message: "Cuarto de consulta eliminado exitosamente",
    };
  } catch (error) {
    console.error("Error en deleteConsultationRoom:", error);
    return {
      success: false,
      message: "Error al eliminar el cuarto de consulta. Intente nuevamente",
    };
  }
}
