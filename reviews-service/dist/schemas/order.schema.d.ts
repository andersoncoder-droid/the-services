import { z } from "zod";
export declare const createOrderSchema: z.ZodObject<{
    user_id: z.ZodString;
    correo_usuario: z.ZodEmail;
    direccion: z.ZodString;
    nombre_completo: z.ZodString;
    productos: z.ZodArray<z.ZodObject<{
        producto_id: z.ZodNumber;
        cantidad: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const updateOrderSchema: z.ZodObject<{
    estado: z.ZodOptional<z.ZodEnum<{
        pendiente: "pendiente";
        procesando: "procesando";
        enviado: "enviado";
        entregado: "entregado";
        cancelado: "cancelado";
    }>>;
    direccion: z.ZodOptional<z.ZodString>;
    fecha_entrega: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const orderIdSchema: z.ZodObject<{
    id: z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>;
}, z.core.$strip>;
export declare const ordersQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    user_id: z.ZodOptional<z.ZodString>;
    estado: z.ZodOptional<z.ZodEnum<{
        pendiente: "pendiente";
        procesando: "procesando";
        enviado: "enviado";
        entregado: "entregado";
        cancelado: "cancelado";
    }>>;
    fecha_desde: z.ZodOptional<z.ZodString>;
    fecha_hasta: z.ZodOptional<z.ZodString>;
    sort: z.ZodDefault<z.ZodEnum<{
        total: "total";
        estado: "estado";
        fecha_pago: "fecha_pago";
    }>>;
    order: z.ZodDefault<z.ZodEnum<{
        ASC: "ASC";
        DESC: "DESC";
    }>>;
}, z.core.$strip>;
export declare const userIdSchema: z.ZodObject<{
    user_id: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=order.schema.d.ts.map