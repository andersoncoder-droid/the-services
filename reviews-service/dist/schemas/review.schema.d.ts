import { z } from "zod";
export declare const createReviewSchema: z.ZodObject<{
    producto_id: z.ZodNumber;
    calificacion: z.ZodNumber;
    comentario: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateReviewSchema: z.ZodObject<{
    calificacion: z.ZodOptional<z.ZodNumber>;
    comentario: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const reviewIdSchema: z.ZodObject<{
    id: z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>;
}, z.core.$strip>;
export declare const reviewsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    producto_id: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    usuario_id: z.ZodOptional<z.ZodString>;
    sort: z.ZodDefault<z.ZodEnum<{
        calificacion: "calificacion";
        fecha: "fecha";
    }>>;
    order: z.ZodDefault<z.ZodEnum<{
        ASC: "ASC";
        DESC: "DESC";
    }>>;
    calificacion_min: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    calificacion_max: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const productIdSchema: z.ZodObject<{
    producto_id: z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>;
}, z.core.$strip>;
//# sourceMappingURL=review.schema.d.ts.map