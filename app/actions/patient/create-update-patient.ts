"use server";

import { z } from "zod";
import prisma from "@/app/lib/prisma";

// Schema de validación para crear o actualizar patient
const patientSchema = z.object({
  id: z.number().optional(), // Si existe ID, es actualización
  email: z
    .string()
    .email("Email inválido")
    .max(150, "El email no puede exceder 150 caracteres")
    .toLowerCase()
    .trim(),
  registeredDate: z
    .string()
    .or(z.date())
    .transform((val) => {
      if (typeof val === "string") {
        return new Date(val);
      }
      return val;
    })
    .optional(),
  active: z.boolean().optional().default(true),
  assignedPsychologist: z.number().positive().optional().nullable(),
});

type PatientInput = z.infer<typeof patientSchema>;

interface ActionResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    email: string;
    registeredDate: Date;
    active: boolean;
    assignedPsychologist: number | null;
  };
}

export async function createOrUpdatePatientAction(
  patientData: PatientInput
): Promise<ActionResponse> {
  try {
    console.log("📝 Datos recibidos para paciente:", {
      id: patientData.id,
      email: patientData.email,
      assignedPsychologist: patientData.assignedPsychologist,
      active: patientData.active,
    });

    // Validar datos con Zod
    const validatedData = patientSchema.parse(patientData);
    console.log("✅ Datos validados correctamente");

    const isUpdate = !!validatedData.id;

    // Si es actualización, validar que el paciente existe
    if (isUpdate) {
      const existingPatient = await prisma.patient.findUnique({
        where: { id: validatedData.id },
      });

      if (!existingPatient) {
        console.log("❌ Paciente no encontrado para actualización");
        return {
          success: false,
          message: "Paciente no encontrado",
        };
      }
    }

    // Verificar si el email ya existe (en caso de creación o cambio de email)
    if (!isUpdate || validatedData.email) {
      const existingEmail = await prisma.patient.findFirst({
        where: {
          email: validatedData.email,
          ...(isUpdate && { NOT: { id: validatedData.id } }),
        },
      });

      if (existingEmail) {
        console.log("⚠️ Email ya existe:", validatedData.email);
        return {
          success: false,
          message: "Ya existe un paciente con este email",
        };
      }
    }

    // Verificar que el psicólogo asignado existe y está activo si se proporciona
    if (validatedData.assignedPsychologist) {
      const psychologist = await prisma.staff.findUnique({
        where: { id: validatedData.assignedPsychologist },
      });

      if (!psychologist) {
        console.log(
          "⚠️ Psicólogo no encontrado:",
          validatedData.assignedPsychologist
        );
        return {
          success: false,
          message: "El psicólogo especificado no existe",
        };
      }

      if (!psychologist.active) {
        console.log(
          "⚠️ Psicólogo inactivo:",
          validatedData.assignedPsychologist
        );
        return {
          success: false,
          message: "El psicólogo especificado está inactivo",
        };
      }
    }

    // Preparar datos para upsert
    const dataToUpsert = {
      email: validatedData.email,
      active: validatedData.active ?? true,
      assignedPsychologist: validatedData.assignedPsychologist ?? null,
      ...(validatedData.registeredDate && {
        registeredDate: validatedData.registeredDate,
      }),
    };

    // Usar upsert de Prisma
    console.log(
      isUpdate ? "📝 Actualizando paciente..." : "🆕 Creando nuevo paciente..."
    );

    const patient = await prisma.patient.upsert({
      where: {
        id: validatedData.id || -1, // Si no hay ID, usar -1 para forzar creación
      },
      create: dataToUpsert,
      update: dataToUpsert,
      select: {
        id: true,
        email: true,
        registeredDate: true,
        active: true,
        assignedPsychologist: true,
        psychologist: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    console.log("✅ Paciente guardado exitosamente:", {
      id: patient.id,
      email: patient.email,
      psychologist: patient.psychologist
        ? `${patient.psychologist.firstName} ${patient.psychologist.lastName}`
        : "Sin asignar",
    });

    return {
      success: true,
      message: isUpdate
        ? "Paciente actualizado exitosamente"
        : "Paciente creado exitosamente",
      data: {
        id: patient.id,
        email: patient.email,
        registeredDate: patient.registeredDate,
        active: patient.active,
        assignedPsychologist: patient.assignedPsychologist,
      },
    };
  } catch (error) {
    console.error("💥 Error en createOrUpdatePatientAction:", error);

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
          message: "Ya existe un paciente con estos datos",
        };
      }

      if (error.message.includes("Foreign key constraint")) {
        return {
          success: false,
          message:
            "Error de referencia: verifica que el psicólogo asignado exista",
        };
      }
    }

    return {
      success: false,
      message: "Error al procesar la solicitud. Intente nuevamente",
    };
  }
}
