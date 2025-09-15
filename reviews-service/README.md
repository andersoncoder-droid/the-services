# Reviews Service - ByteStore API

Servicio de reseñas/calificaciones para la plataforma ByteStore. Este microservicio maneja las operaciones CRUD para reviews de productos.

## Características

- ✅ Autenticación JWT con validación de roles
- ✅ CRUD completo para reviews/calificaciones
- ✅ Paginación con estructura estándar
- ✅ Ordenamiento por fecha y calificación
- ✅ Validaciones con Zod
- ✅ Control de permisos (propietario/admin)
- ✅ Base de datos MySQL con transacciones
- ✅ Formato ISO para fechas

## Tecnologías

- **Node.js** con **TypeScript**
- **Express.js** para el servidor web
- **MySQL2** para base de datos
- **JWT** para autenticación
- **Zod** para validaciones
- **Morgan** para logging

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```
   Editar `.env` con tus configuraciones.

4. Configurar la base de datos:
   - Crear la base de datos MySQL
   - Ejecutar el script `init/data.sql` para crear las tablas y datos de prueba

5. Ejecutar en desarrollo:
   ```bash
   npm run dev
   ```

6. Compilar para producción:
   ```bash
   npm run build
   npm start
   ```

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|----------|
| `PORT` | Puerto del servidor | `3003` |
| `DB_HOST` | Host de MySQL | `localhost` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | `password` |
| `DB_NAME` | Nombre de la base de datos | `bytestore_reviews` |
| `JWT_SECRET` | Secreto para JWT | `@y*&0a%K%7P0t@uQ^38HN$y4Z^PK#0zE7dem700Bbf&pC6HF$aU^ARkE@u$nn` |
| `JWT_EXPIRES_IN` | Duración del token | `30d` |

## API Endpoints

### Reviews/Calificaciones

#### `GET /reviews`
Obtiene reviews paginadas con filtros y ordenamiento.

**Query Parameters:**
- `page` (number): Página actual (default: 1)
- `limit` (number): Elementos por página (default: 10, max: 100)
- `producto_id` (number): Filtrar por producto
- `user_id` (number): Filtrar por usuario (solo admin)
- `calificacion` (number): Filtrar por calificación (1-5)
- `fecha_desde` (string): Fecha desde (ISO format)
- `fecha_hasta` (string): Fecha hasta (ISO format)
- `sort` (string): Campo de ordenamiento (`fecha_creacion`, `calificacion`)
- `order` (string): Dirección (`asc`, `desc`)

**Response:**
```json
{
  "total": 51,
  "pages": 3,
  "first": 1,
  "next": 2,
  "prev": null,
  "data": [
    {
      "calificacion_id": 1,
      "user_id": 1,
      "producto_id": 1,
      "calificacion": 5,
      "comentario": "Excelente producto",
      "fecha_creacion": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### `POST /reviews`
Crea una nueva review.

**Body:**
```json
{
  "producto_id": 1,
  "calificacion": 5,
  "comentario": "Excelente producto, muy recomendado"
}
```

#### `GET /reviews/:id`
Obtiene una review por ID.

#### `PUT /reviews/:id`
Actualiza una review (solo propietario o admin).

**Body:**
```json
{
  "calificacion": 4,
  "comentario": "Buen producto, actualizo mi review"
}
```

#### `DELETE /reviews/:id`
Elimina una review (solo propietario o admin).



## Autenticación

Todas las rutas requieren autenticación JWT. El token debe enviarse en el header:

```
Authorization: Bearer <token>
```

### Roles y Permisos

- **Usuario normal**: Puede crear, ver y editar sus propias reviews y órdenes
- **Administrador**: Puede realizar todas las operaciones sobre cualquier recurso

## Estructura de la Base de Datos

### Tabla `calificaciones`
- `calificacion_id` (PK, AUTO_INCREMENT)
- `user_id` (FK)
- `producto_id`
- `calificacion` (1-5)
- `comentario` (TEXT)
- `fecha_creacion` (DATETIME)

### Tabla `ordenes`
- `orden_id` (PK, AUTO_INCREMENT)
- `user_id` (FK)
- `correo_usuario`
- `direccion`
- `nombre_completo`
- `estado` (ENUM)
- `total` (DECIMAL)
- `fecha_pago` (DATETIME)
- `fecha_entrega` (DATETIME)

### Tabla `orden_productos`
- `orden_producto_id` (PK, AUTO_INCREMENT)
- `orden_id` (FK)
- `producto_id`
- `nombre`, `precio`, `descuento`, `marca`, `modelo`, `cantidad`, `imagen`

## Códigos de Estado HTTP

- `200` - OK (operación exitosa)
- `201` - Created (recurso creado)
- `400` - Bad Request (datos inválidos)
- `401` - Unauthorized (no autenticado)
- `403` - Forbidden (sin permisos)
- `404` - Not Found (recurso no encontrado)
- `500` - Internal Server Error (error del servidor)

## Desarrollo

### Estructura del Proyecto

```
src/
├── controllers/     # Controladores de las rutas
├── middleware/      # Middleware de autenticación
├── routes/         # Definición de rutas
├── schemas/        # Validaciones Zod
├── types/          # Tipos TypeScript
├── utils/          # Utilidades (JWT)
├── db.ts           # Configuración de base de datos
└── index.ts        # Punto de entrada
```

### Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo con recarga automática
- `npm run build` - Compilar TypeScript a JavaScript
- `npm start` - Ejecutar versión compilada

## Docker

Para ejecutar con Docker:

```bash
# Construir imagen
docker build -t reviews-service .

# Ejecutar contenedor
docker run -p 3003:3003 --env-file .env reviews-service
```

## Notas Importantes

- Las fechas se manejan en formato ISO 8601
- La paginación sigue la estructura estándar especificada
- Los precios se almacenan como DECIMAL para precisión
- Las transacciones garantizan consistencia en operaciones complejas
- El middleware de autenticación valida tanto la existencia del token como del usuario