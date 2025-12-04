"use server";

import { z } from "zod";
import bcrypt from "bcrypt";
import { SignJWT, jwtVerify } from "jose";
import prisma from "@/app/lib/prisma";

// Schema de validación para el login
const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

// Tipos de respuesta
type LoginResponse = {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    userType: "admin" | "staff";
  };
};

/**
 * Action para iniciar sesión
 * @param formData - Datos del formulario de login
 * @returns Respuesta con token JWT y datos del usuario
 */
export async function loginAction(formData: FormData): Promise<LoginResponse> {
  try {
    // Extraer y validar datos del formulario
    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    console.log("📨 Datos recibidos en loginAction:", {
      email: rawData.email,
      hasPassword: !!rawData.password,
      passwordLength: rawData.password ? String(rawData.password).length : 0,
    });

    // Validar con Zod
    const validatedData = loginSchema.safeParse(rawData);

    if (!validatedData.success) {
      const firstError = validatedData.error.issues[0];
      console.log("❌ Error de validación:", firstError.message);
      return {
        success: false,
        message: firstError.message,
      };
    }

    const { email, password } = validatedData.data;
    console.log("✅ Datos validados correctamente:", { email });

    // Buscar usuario en ambas tablas (Admin y Staff)
    let user: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      passwordHash: string;
      active: boolean;
    } | null = null;
    let userType: "admin" | "staff" | null = null;

    // Primero buscar en Admin
    console.log("🔍 Buscando en tabla Admin...");
    user = await prisma.admin.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        active: true,
      },
    });

    if (user) {
      userType = "admin";
      console.log("✅ Usuario encontrado en Admin");
    } else {
      // Si no está en Admin, buscar en Staff
      console.log("🔍 Buscando en tabla Staff...");
      user = await prisma.staff.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          passwordHash: true,
          active: true,
        },
      });

      if (user) {
        userType = "staff";
        console.log("✅ Usuario encontrado en Staff");
      }
    }

    console.log("🔍 Resultado de búsqueda:", {
      email,
      encontrado: !!user,
      tipo: userType,
    });

    // Verificar si el usuario existe
    if (!user) {
      console.log("❌ Usuario no encontrado");
      return {
        success: false,
        message: "Credenciales inválidas",
      };
    }

    console.log("👤 Usuario encontrado:", {
      id: user.id,
      email: user.email,
      nombre: `${user.firstName} ${user.lastName}`,
      activo: user.active,
    });

    // Verificar si el usuario está activo
    if (!user.active) {
      console.log("⚠️ Usuario inactivo");
      return {
        success: false,
        message: "Usuario inactivo. Contacte al administrador",
      };
    }

    // Verificar contraseña
    console.log("🔐 Verificando contraseña...");
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      console.log("❌ Contraseña incorrecta");
      return {
        success: false,
        message: "Credenciales inválidas",
      };
    }

    console.log("✅ Contraseña válida");

    // Generar token JWT con jose
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";

    if (!jwtSecret) {
      throw new Error("JWT_SECRET no está configurado");
    }

    // Convertir el secret a Uint8Array
    const secret = new TextEncoder().encode(jwtSecret);

    // Crear token con jose
    console.log("🔑 Generando token JWT...");
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      userType: userType,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(jwtExpiresIn)
      .sign(secret);

    console.log("✅ Token generado exitosamente");
    console.log("🎉 Login exitoso para:", {
      userId: user.id,
      email: user.email,
      userType,
      tokenPreview: token.substring(0, 20) + "...",
    });

    // Retornar respuesta exitosa
    return {
      success: true,
      message: "Inicio de sesión exitoso",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: userType as "admin" | "staff", // Ya verificamos que no es null
      },
    };
  } catch (error) {
    console.error("💥 Error en loginAction:", error);
    return {
      success: false,
      message: "Error al iniciar sesión. Intente nuevamente",
    };
  }
}

/**
 * Action para verificar un token JWT
 * @param token - Token JWT a verificar
 * @returns Datos del usuario si el token es válido
 */
export async function verifyToken(token: string) {
  try {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET no está configurado");
    }

    // Convertir el secret a Uint8Array
    const secret = new TextEncoder().encode(jwtSecret);

    // Verificar token con jose
    const { payload } = await jwtVerify(token, secret);

    return {
      success: true,
      user: payload as {
        userId: number;
        email: string;
        userType: "admin" | "staff";
      },
    };
  } catch {
    return {
      success: false,
      message: "Token inválido o expirado",
    };
  }
}
