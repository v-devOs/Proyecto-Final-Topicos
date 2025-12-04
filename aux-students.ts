"use server";

import { getAuthToken } from "../../login/jwt-utils";
import { studentInfoSchema } from "./schemas";
import type { StudentInfoActionResult } from "./schemas";

const API_BASE_URL = "https://cetech.roque.tecnm.mx/api";

/**
 * Server Action para obtener la información del estudiante
 * @returns Resultado con la información del estudiante o error
 */
export async function getStudentInfoAction(): Promise<StudentInfoActionResult> {
  try {
    console.log(
      "🔍 [STUDENT INFO] Iniciando obtención de información del estudiante..."
    );

    // Obtener el token de autenticación de las cookies
    const token = await getAuthToken();
    console.log(
      "🔑 [STUDENT INFO] Token obtenido:",
      token ? "✓ Token presente" : "✗ Sin token"
    );

    if (!token) {
      console.error("❌ [STUDENT INFO] No hay token de autenticación");
      return {
        success: false,
        error: "No hay sesión activa. Por favor, inicia sesión nuevamente.",
      };
    }

    console.log(
      `📡 [STUDENT INFO] Haciendo petición GET a: ${API_BASE_URL}/movil/estudiante`
    );
    console.log("📋 [STUDENT INFO] Headers:", {
      Authorization: `Bearer ${token.substring(0, 20)}...`,
      "Content-Type": "application/json",
    });

    // Realizar la petición a la API
    const response = await fetch(`${API_BASE_URL}/movil/estudiante`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store", // Evitar cache para obtener datos actualizados
    });

    console.log(
      `📊 [STUDENT INFO] Status HTTP recibido: ${response.status} ${response.statusText}`
    );

    const data = await response.json();

    // Logs detallados para debugging
    console.log("📦 [STUDENT INFO] Respuesta completa del servidor:");
    console.log(JSON.stringify(data, null, 2));
    console.log("🔍 [STUDENT INFO] Estructura de la respuesta:", {
      responseCodeTxt: data.responseCodeTxt,
      status: data.status,
      flag: data.flag,
      type: data.type,
      hasMessage: !!data.message,
      hasData: !!data.data,
      dataType: typeof data.data,
    });

    // Verificar si hay un error en el body de la respuesta
    if (data.status && data.status !== 200) {
      console.error(
        `❌ [STUDENT INFO] Error en la respuesta - Status: ${data.status}`
      );
      console.error("📄 [STUDENT INFO] Mensaje de error:", data.message);
      console.error(
        "📄 [STUDENT INFO] Código de respuesta:",
        data.responseCodeTxt
      );

      let errorMessage = "";

      if (data.status === 401) {
        errorMessage =
          "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.";
      } else if (data.status === 403) {
        errorMessage = "No tienes permiso para acceder a esta información.";
      } else if (data.status === 404) {
        errorMessage = "No se encontró información del estudiante.";
      } else if (data.status >= 500) {
        errorMessage =
          "El servidor está experimentando problemas. Por favor, intenta más tarde.";
      } else {
        errorMessage =
          data.message ||
          data.responseCodeTxt ||
          `Error ${data.status}: No se pudo obtener la información.`;
      }

      console.error(
        `💬 [STUDENT INFO] Mensaje de error final: ${errorMessage}`
      );
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Verificar si la respuesta HTTP fue exitosa
    if (!response.ok) {
      console.error(
        `❌ [STUDENT INFO] Respuesta HTTP no exitosa: ${response.status}`
      );
      return {
        success: false,
        error: data.message || "Error al obtener la información del estudiante",
      };
    }

    // Extraer los datos del estudiante
    console.log("🔎 [STUDENT INFO] Intentando extraer datos del estudiante...");
    console.log("📍 [STUDENT INFO] Buscando en data.data:", !!data.data);
    console.log(
      "📍 [STUDENT INFO] Buscando en data.message.student:",
      !!data.message?.student
    );
    console.log(
      "📍 [STUDENT INFO] Buscando en data.message.estudiante:",
      !!data.message?.estudiante
    );

    const studentData =
      data.data || data.message?.student || data.message?.estudiante || data;

    console.log("📦 [STUDENT INFO] Datos extraídos del estudiante:");
    console.log(JSON.stringify(studentData, null, 2));

    if (!studentData || typeof studentData !== "object") {
      console.error(
        "❌ [STUDENT INFO] No se pudo extraer información válida del estudiante"
      );
      console.error("📄 [STUDENT INFO] Estructura de respuesta completa:");
      console.error(JSON.stringify(data, null, 2));
      return {
        success: false,
        error: "No se recibió información válida del estudiante",
      };
    }

    // Validar y transformar los datos con el schema de Zod
    console.log("🔄 [STUDENT INFO] Validando y transformando datos con Zod...");
    try {
      const validatedData = studentInfoSchema.parse(studentData);
      console.log("✅ [STUDENT INFO] Datos validados y transformados:");
      console.log(JSON.stringify(validatedData, null, 2));
      console.log(
        "📊 [STUDENT INFO] Campos disponibles:",
        Object.keys(validatedData)
      );

      return {
        success: true,
        data: validatedData,
      };
    } catch (zodError) {
      console.error("❌ [STUDENT INFO] Error de validación Zod:", zodError);
      // Si falla la validación, retornar los datos sin transformar
      console.log(
        "⚠️ [STUDENT INFO] Retornando datos sin validar debido a error en schema"
      );
      return {
        success: true,
        data: studentData,
      };
    }
  } catch (error) {
    console.error("💥 [STUDENT INFO] Excepción capturada:", error);
    console.error("📄 [STUDENT INFO] Detalles del error:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error:
        "Error al conectar con el servidor. Por favor, verifica tu conexión.",
    };
  }
}

/**
 * Server Action para refrescar la información del estudiante
 * Útil cuando se necesita forzar la actualización de datos
 * @returns Resultado con la información actualizada del estudiante
 */
export async function refreshStudentInfoAction(): Promise<StudentInfoActionResult> {
  console.log("🔄 [STUDENT INFO] Refrescando información del estudiante...");
  // Reutiliza la misma lógica pero sin caché
  return getStudentInfoAction();
}
