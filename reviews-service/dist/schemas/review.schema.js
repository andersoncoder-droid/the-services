import { z } from "zod";
// Esquema para crear una nueva reseña
export const createReviewSchema = z.object({
    producto_id: z
        .number()
        .int("El ID del producto debe ser un número entero")
        .positive("El ID del producto debe ser positivo"),
    calificacion: z
        .number()
        .int("La calificación debe ser un número entero")
        .min(1, "La calificación mínima es 1")
        .max(5, "La calificación máxima es 5"),
    comentario: z
        .string()
        .trim()
        .min(10, "El comentario debe tener al menos 10 caracteres")
        .max(1000, "El comentario no puede exceder 1000 caracteres")
        .regex(/^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\s\.,;:!?¿¡()"'-]+$/, "El comentario contiene caracteres no válidos")
        .optional(),
});
// Esquema para actualizar una reseña
export const updateReviewSchema = z.object({
    calificacion: z
        .number()
        .int("La calificación debe ser un número entero")
        .min(1, "La calificación mínima es 1")
        .max(5, "La calificación máxima es 5")
        .optional(),
    comentario: z
        .string()
        .trim()
        .min(10, "El comentario debe tener al menos 10 caracteres")
        .max(1000, "El comentario no puede exceder 1000 caracteres")
        .regex(/^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\s\.,;:!?¿¡()"'-]+$/, "El comentario contiene caracteres no válidos")
        .optional(),
});
// Esquema para parámetros de ID
export const reviewIdSchema = z.object({
    id: z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val > 0, {
        message: "El ID debe ser un número positivo",
    }),
});
// Esquema para consultas paginadas de reseñas
export const reviewsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    producto_id: z.coerce.number().int().positive().optional(),
    usuario_id: z.string().trim().optional(),
    sort: z.enum(["fecha", "calificacion"]).default("fecha"),
    order: z.enum(["ASC", "DESC"]).default("DESC"),
    calificacion_min: z.coerce.number().int().min(1).max(5).optional(),
    calificacion_max: z.coerce.number().int().min(1).max(5).optional(),
});
// Esquema para validar producto_id en parámetros
export const productIdSchema = z.object({
    producto_id: z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val > 0, {
        message: "El ID del producto debe ser un número positivo",
    }),
});
//# sourceMappingURL=review.schema.js.map