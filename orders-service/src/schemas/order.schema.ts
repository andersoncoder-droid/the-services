import { z } from "zod";

// Esquema para crear una nueva orden
export const createOrderSchema = z.object({
  user_id: z
    .string()
    .trim()
    .min(1, "El ID del usuario es requerido"),
  correo_usuario: z
    .string()
    .email("Email inválido")
    .trim()
    .min(5, "El email debe tener al menos 5 caracteres")
    .max(300, "El email no puede exceder 300 caracteres"),
  direccion: z
    .string()
    .trim()
    .min(10, "La dirección debe tener al menos 10 caracteres")
    .max(500, "La dirección no puede exceder 500 caracteres")
    .regex(
      /^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\s\.,#°-]+$/,
      "La dirección contiene caracteres no válidos"
    ),
  nombre_completo: z
    .string()
    .trim()
    .min(6, "El nombre completo debe tener al menos 6 caracteres")
    .max(200, "El nombre completo no puede exceder 200 caracteres")
    .regex(
      /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/,
      "El nombre solo puede contener letras y espacios"
    ),
  productos: z
    .array(
      z.object({
        producto_id: z
          .number()
          .int("El ID del producto debe ser un número entero")
          .positive("El ID del producto debe ser positivo"),
        cantidad: z
          .number()
          .int("La cantidad debe ser un número entero")
          .positive("La cantidad debe ser positiva")
          .max(100, "La cantidad máxima por producto es 100"),
      })
    )
    .min(1, "Debe incluir al menos un producto")
    .max(50, "No se pueden incluir más de 50 productos por orden"),
});

// Esquema para actualizar una orden
export const updateOrderSchema = z.object({
  estado: z
    .enum(["pendiente", "procesando", "enviado", "entregado", "cancelado"])
    .optional(),
  direccion: z
    .string()
    .trim()
    .min(10, "La dirección debe tener al menos 10 caracteres")
    .max(500, "La dirección no puede exceder 500 caracteres")
    .regex(
      /^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\s\.,#°-]+$/,
      "La dirección contiene caracteres no válidos"
    )
    .optional(),
  fecha_entrega: z
    .string()
    .datetime({ message: "Formato de fecha inválido. Use formato ISO 8601" })
    .optional(),
});

// Esquema para parámetros de ID de orden
export const orderIdSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "El ID de la orden debe ser un número positivo",
    }),
});

// Esquema para consultas paginadas de órdenes
export const ordersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  user_id: z.string().trim().optional(),
  estado: z
    .enum(["pendiente", "procesando", "enviado", "entregado", "cancelado"])
    .optional(),
  fecha_desde: z
    .string()
    .datetime({ message: "Formato de fecha inválido. Use formato ISO 8601" })
    .optional(),
  fecha_hasta: z
    .string()
    .datetime({ message: "Formato de fecha inválido. Use formato ISO 8601" })
    .optional(),
  sort: z.enum(["fecha_pago", "total", "estado"]).default("fecha_pago"),
  order: z.enum(["ASC", "DESC"]).default("DESC"),
});

// Esquema para parámetros de usuario
export const userIdSchema = z.object({
  user_id: z.string().trim().min(1, "El ID del usuario es requerido"),
});