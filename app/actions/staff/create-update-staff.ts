"use server";

import { z } from "zod";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcrypt";

// Schema de validación para crear o actualizar staff
const staffSchema = z.object({
  id: z.number().optional(), // Si existe ID, es actualización
  firstName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
  lastName: z
    .string()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(100, "El apellido no puede exceder 100 caracteres")
    .trim(),
  email: z
    .string()
    .email("Email inválido")
    .max(150, "El email no puede exceder 150 caracteres")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(100, "La contraseña no puede exceder 100 caracteres")
    .optional(), // Opcional en actualización
  phone: z
    .string()
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .optional()
    .nullable(),
  dateOfBirth: z
    .string()
    .or(z.date())
    .transform((val) => {
      if (typeof val === "string") {
        return new Date(val);
      }
      return val;
    })
    .optional()
    .nullable(),
  hireDate: z
    .string()
    .or(z.date())
    .transform((val) => {
      if (typeof val === "string") {
        return new Date(val);
      }
      return val;
    })
    .optional(),
  consultationRoomId: z.number().positive().optional().nullable(),
  active: z.boolean().optional().default(true),
  createdById: z.number().positive().optional().nullable(),
});

type StaffInput = z.infer<typeof staffSchema>;

interface ActionResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    dateOfBirth: Date | null;
    hireDate: Date;
    consultationRoomId: number | null;
    active: boolean;
  };
}

export async function createOrUpdateStaffAction(
  staffData: StaffInput
): Promise<ActionResponse> {
  try {
    console.log("📝 Datos recibidos para staff:", {
      id: staffData.id,
      email: staffData.email,
      hasPassword: !!staffData.password,
      consultationRoomId: staffData.consultationRoomId,
      active: staffData.active,
    });

    // Validar datos con Zod
    const validatedData = staffSchema.parse(staffData);
    console.log("✅ Datos validados correctamente");

    const isUpdate = !!validatedData.id;

    // Si es actualización y no se proporciona contraseña, validar que el staff existe
    if (isUpdate && !validatedData.password) {
      const existingStaff = await prisma.staff.findUnique({
        where: { id: validatedData.id },
      });

      if (!existingStaff) {
        console.log("❌ Staff no encontrado para actualización");
        return {
          success: false,
          message: "Miembro del staff no encontrado",
        };
      }
    }

    // Verificar si el email ya existe (en caso de creación o cambio de email)
    if (!isUpdate || validatedData.email) {
      const existingEmail = await prisma.staff.findFirst({
        where: {
          email: validatedData.email,
          ...(isUpdate && { NOT: { id: validatedData.id } }),
        },
      });

      if (existingEmail) {
        console.log("⚠️ Email ya existe:", validatedData.email);
        return {
          success: false,
          message: "Ya existe un miembro del staff con este email",
        };
      }
    }

    // Verificar que el consultation room existe si se proporciona
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

    // Verificar que el admin creador existe si se proporciona
    if (validatedData.createdById) {
      const admin = await prisma.admin.findUnique({
        where: { id: validatedData.createdById },
      });

      if (!admin) {
        console.log(
          "⚠️ Admin creador no encontrado:",
          validatedData.createdById
        );
        return {
          success: false,
          message: "El administrador especificado no existe",
        };
      }
    }

    // Hashear contraseña si se proporciona
    let passwordHash: string | undefined;
    if (validatedData.password) {
      console.log("🔐 Hasheando contraseña...");
      passwordHash = await bcrypt.hash(validatedData.password, 10);
      console.log("✅ Contraseña hasheada");
    }

    // Preparar datos para upsert
    const dataToUpsert = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      phone: validatedData.phone ?? null,
      dateOfBirth: validatedData.dateOfBirth ?? null,
      consultationRoomId: validatedData.consultationRoomId ?? null,
      active: validatedData.active ?? true,
      createdById: validatedData.createdById ?? null,
      ...(validatedData.hireDate && { hireDate: validatedData.hireDate }),
    };

    // Usar upsert de Prisma
    console.log(
      isUpdate ? "📝 Actualizando staff..." : "🆕 Creando nuevo staff..."
    );

    const staff = await prisma.staff.upsert({
      where: {
        id: validatedData.id || -1, // Si no hay ID, usar -1 para forzar creación
      },
      create: {
        ...dataToUpsert,
        passwordHash: passwordHash!, // Requerido en creación
      },
      update: {
        ...dataToUpsert,
        ...(passwordHash && { passwordHash }), // Solo actualizar si se proporcionó nueva contraseña
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        hireDate: true,
        consultationRoomId: true,
        active: true,
        createdAt: true,
        consultationRoom: {
          select: {
            code: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    console.log("✅ Staff guardado exitosamente:", {
      id: staff.id,
      email: staff.email,
      consultationRoom: staff.consultationRoom?.name,
    });

    return {
      success: true,
      message: isUpdate
        ? "Miembro del staff actualizado exitosamente"
        : "Miembro del staff creado exitosamente",
      data: {
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone,
        dateOfBirth: staff.dateOfBirth,
        hireDate: staff.hireDate,
        consultationRoomId: staff.consultationRoomId,
        active: staff.active,
      },
    };
  } catch (error) {
    console.error("💥 Error en createOrUpdateStaffAction:", error);

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
          message: "Ya existe un miembro del staff con estos datos",
        };
      }

      if (error.message.includes("Foreign key constraint")) {
        return {
          success: false,
          message:
            "Error de referencia: verifica que el consultorio y/o administrador existan",
        };
      }
    }

    return {
      success: false,
      message: "Error al procesar la solicitud. Intente nuevamente",
    };
  }
}
