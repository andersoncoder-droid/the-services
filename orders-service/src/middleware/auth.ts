import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import type { JWTData } from "../types/token.js";

/**
 * Middleware para validar token JWT
 * Verifica que el usuario esté autenticado
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ 
        message: "Token de autorización requerido",
        error: "MISSING_TOKEN" 
      });
    }

    // Decodificar y verificar token
    const decoded: JWTData | null = verifyToken(authHeader);

    if (!decoded) {
      return res.status(401).json({ 
        message: "Token inválido o expirado",
        error: "INVALID_TOKEN" 
      });
    }

    // Guardar datos del usuario en el request
    req.auth = decoded;
    next();
  } catch (error) {
    console.error("Error en middleware de autenticación:", error);
    return res.status(500).json({ 
      message: "Error interno del servidor",
      error: "INTERNAL_ERROR" 
    });
  }
}

/**
 * Middleware para validar si el usuario es administrador
 * Requiere que authMiddleware se ejecute primero
 */
export async function isAdmin(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<Response | void> {
  try {
    // Validar si existe información de autenticación
    if (!req.auth) {
      return res.status(401).json({ 
        message: "No autorizado - Token requerido",
        error: "MISSING_AUTH" 
      });
    }

    // Validar rol de administrador
    if (req.auth.role !== "ADMINISTRADOR") {
      return res.status(403).json({ 
        message: "Acceso denegado - Se requieren permisos de administrador",
        error: "INSUFFICIENT_PERMISSIONS" 
      });
    }

    next();
  } catch (error) {
    console.error("Error en middleware de administrador:", error);
    return res.status(500).json({ 
      message: "Error interno del servidor",
      error: "INTERNAL_ERROR" 
    });
  }
}

/**
 * Middleware para validar acceso a recursos
 * Permite acceso al propietario del recurso o administradores
 */
export function canAccessResource(
  req: Request, 
  res: Response, 
  next: NextFunction
): Response | void {
  try {
    if (!req.auth) {
      return res.status(401).json({ 
        message: "No autorizado - Token requerido",
        error: "MISSING_AUTH" 
      });
    }

    // Obtener ID del usuario del recurso (desde parámetros o body)
    const resourceUserId = req.params.userId || req.body.user_id || req.query.user_id;
    const isOwner = req.auth.id === resourceUserId;
    const isAdminUser = req.auth.role === "ADMINISTRADOR";

    if (!isOwner && !isAdminUser) {
      return res.status(403).json({ 
        message: "Acceso denegado - Solo el propietario o un administrador pueden acceder",
        error: "ACCESS_DENIED" 
      });
    }

    next();
  } catch (error) {
    console.error("Error en middleware de acceso a recursos:", error);
    return res.status(500).json({ 
      message: "Error interno del servidor",
      error: "INTERNAL_ERROR" 
    });
  }
}