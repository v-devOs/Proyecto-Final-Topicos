"use server";

import { z } from "zod";
import prisma from "@/app/lib/prisma";
import bcrypt from "bcrypt";

// Schema de validación para crear o actualizar admin
const adminSchema = z.object({
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
  active: z.boolean().optional().default(true),
});

type AdminInput = z.infer<typeof adminSchema>;

interface ActionResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    active: boolean;
  };
}

export async function createOrUpdateAdminAction(
  adminData: AdminInput
): Promise<ActionResponse> {
  try {
    console.log("📝 Datos recibidos para admin:", {
      id: adminData.id,
      email: adminData.email,
      hasPassword: !!adminData.password,
      active: adminData.active,
    });

    // Validar datos con Zod
    const validatedData = adminSchema.parse(adminData);
    console.log("✅ Datos validados correctamente");

    const isUpdate = !!validatedData.id;

    // Si es actualización y no se proporciona contraseña, validar que el admin existe
    if (isUpdate && !validatedData.password) {
      const existingAdmin = await prisma.admin.findUnique({
        where: { id: validatedData.id },
      });

      if (!existingAdmin) {
        console.log("❌ Admin no encontrado para actualización");
        return {
          success: false,
          message: "Administrador no encontrado",
        };
      }
    }

    // Verificar si el email ya existe (en caso de creación o cambio de email)
    if (!isUpdate || validatedData.email) {
      const existingEmail = await prisma.admin.findFirst({
        where: {
          email: validatedData.email,
          ...(isUpdate && { NOT: { id: validatedData.id } }),
        },
      });

      if (existingEmail) {
        console.log("⚠️ Email ya existe:", validatedData.email);
        return {
          success: false,
          message: "Ya existe un administrador con este email",
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
      active: validatedData.active ?? true,
    };

    // Usar upsert de Prisma
    console.log(
      isUpdate ? "📝 Actualizando admin..." : "🆕 Creando nuevo admin..."
    );

    const admin = await prisma.admin.upsert({
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
        active: true,
        createdAt: true,
      },
    });

    console.log("✅ Admin guardado exitosamente:", {
      id: admin.id,
      email: admin.email,
    });

    return {
      success: true,
      message: isUpdate
        ? "Administrador actualizado exitosamente"
        : "Administrador creado exitosamente",
      data: {
        id: admin.id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        active: admin.active,
      },
    };
  } catch (error) {
    console.error("💥 Error en createOrUpdateAdminAction:", error);

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
          message: "Ya existe un administrador con estos datos",
        };
      }
    }

    return {
      success: false,
      message: "Error al procesar la solicitud. Intente nuevamente",
    };
  }
}
