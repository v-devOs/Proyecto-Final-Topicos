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
  userType: z.enum(["admin", "staff"], { message: "Tipo de usuario inválido" }),
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
      userType: formData.get("userType"),
    };

    // Validar con Zod
    const validatedData = loginSchema.safeParse(rawData);

    if (!validatedData.success) {
      const firstError = validatedData.error.issues[0];
      return {
        success: false,
        message: firstError.message,
      };
    }

    const { email, password, userType } = validatedData.data;

    // Buscar usuario según el tipo
    let user: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      passwordHash: string;
      active: boolean;
    } | null = null;

    if (userType === "admin") {
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
    } else if (userType === "staff") {
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
    }

    // Verificar si el usuario existe
    if (!user) {
      return {
        success: false,
        message: "Credenciales inválidas",
      };
    }

    // Verificar si el usuario está activo
    if (!user.active) {
      return {
        success: false,
        message: "Usuario inactivo. Contacte al administrador",
      };
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return {
        success: false,
        message: "Credenciales inválidas",
      };
    }

    // Generar token JWT con jose
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";

    if (!jwtSecret) {
      throw new Error("JWT_SECRET no está configurado");
    }

    // Convertir el secret a Uint8Array
    const secret = new TextEncoder().encode(jwtSecret);

    // Crear token con jose
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      userType: userType,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(jwtExpiresIn)
      .sign(secret);

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
        userType: userType,
      },
    };
  } catch (error) {
    console.error("Error en loginAction:", error);
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
