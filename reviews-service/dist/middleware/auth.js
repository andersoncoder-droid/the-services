import { verifyToken } from "../utils/jwt.js";
// Validar token JWT
export async function authMiddleware(req, res, next) {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Token requerido" });
    }
    // Decodificar token
    const decoded = verifyToken(authHeader);
    if (!decoded) {
        return res.status(401).json({ message: "Token inválido o expirado" });
    }
    try {
        // Validar existencia del usuario (consulta a la base de datos de usuarios)
        // Nota: En un entorno real, esto podría ser una llamada a otro microservicio
        // Por ahora, asumimos que el token es válido si se puede decodificar
        // Guardar datos del usuario en el request
        req.auth = decoded;
        next();
    }
    catch (error) {
        return res.status(500).json({ message: "Error del servidor", error });
    }
}
// Validar si el usuario es administrador
export async function isAdmin(req, res, next) {
    // Validar si existe validación del token
    if (!req.auth) {
        return res.status(401).json({ message: "No autorizado" });
    }
    // Validar rol en el token
    if (req.auth.role !== "ADMINISTRADOR") {
        return res.status(403).json({ message: "Acceso denegado. Se requieren permisos de administrador" });
    }
    next();
}
// Validar si el usuario puede acceder al recurso (propietario o admin)
export function canAccessResource(req, res, next) {
    if (!req.auth) {
        return res.status(401).json({ message: "No autorizado" });
    }
    const resourceUserId = req.params.userId || req.body.usuario_id;
    const isOwner = req.auth.id === resourceUserId;
    const isAdminUser = req.auth.role === "ADMINISTRADOR";
    if (!isOwner && !isAdminUser) {
        return res.status(403).json({ message: "Acceso denegado. Solo el propietario o un administrador pueden acceder a este recurso" });
    }
    next();
}
//# sourceMappingURL=auth.js.map