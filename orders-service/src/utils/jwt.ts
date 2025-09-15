import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import type { JWTData } from "../types/token.js";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "fallback_secret_key";

/**
 * Verifica y decodifica un token JWT
 * @param authHeader - Header de autorización (Bearer token)
 * @returns Datos decodificados del token o null si es inválido
 */
export function verifyToken(authHeader: string): JWTData | null {
  try {
    // Extraer el token del header "Bearer token"
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return null;
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTData;
    return decoded;
  } catch (error) {
    console.error("Error al verificar token:", error);
    return null;
  }
}

/**
 * Genera un nuevo token JWT
 * @param payload - Datos a incluir en el token
 * @param expiresIn - Tiempo de expiración (default: 24h)
 * @returns Token JWT generado
 */
export function generateToken(
  payload: Omit<JWTData, "iat" | "exp">,
  expiresIn: string = "24h"
): string {
  const options: SignOptions = { expiresIn: expiresIn as any };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Decodifica un token sin verificar su validez (solo para inspección)
 * @param token - Token JWT
 * @returns Datos decodificados o null
 */
export function decodeToken(token: string): JWTData | null {
  try {
    return jwt.decode(token) as JWTData;
  } catch (error) {
    console.error("Error al decodificar token:", error);
    return null;
  }
}