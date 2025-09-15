# 📦 Orders Service - ByteStore API

## 🚀 Descripción

Microservicio dedicado a la gestión completa de órdenes para ByteStore. Proporciona funcionalidades avanzadas para el manejo del ciclo de vida de las órdenes, desde su creación hasta la entrega, incluyendo gestión de estados, productos y estadísticas.

## ✨ Características Principales

- **Gestión Completa de Órdenes**: CRUD completo con validaciones robustas
- **Manejo de Estados**: Flujo de trabajo con transiciones controladas
- **Gestión de Productos**: Administración de productos dentro de órdenes
- **Historial de Cambios**: Trazabilidad completa de modificaciones
- **Estadísticas Avanzadas**: Métricas y análisis de órdenes
- **Autenticación JWT**: Seguridad basada en tokens
- **Autorización por Roles**: Control de acceso granular
- **Base de Datos MySQL**: Persistencia confiable con transacciones

## 🛠️ Tecnologías Utilizadas

- **Node.js** (v18+) - Runtime de JavaScript
- **TypeScript** - Tipado estático
- **Express.js** - Framework web
- **MySQL** - Base de datos relacional
- **JWT** - Autenticación
- **Zod** - Validación de esquemas
- **CORS** - Manejo de políticas de origen cruzado

## 📋 Prerrequisitos

- Node.js >= 18.0.0
- npm >= 8.0.0
- MySQL >= 8.0
- Git

## 🔧 Instalación

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd ByteStore-API/orders-service
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto:

```env
# Configuración del servidor
PORT=3001
NODE_ENV=development

# Configuración de la base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=orders_db

# Configuración JWT
JWT_SECRET=tu_jwt_secret_muy_seguro
JWT_EXPIRES_IN=24h

# Configuración CORS
CORS_ORIGIN=http://localhost:3000
```

### 4. Configurar la base de datos

#### Opción A: Usando el script automatizado
```bash
npm run db:init
```

#### Opción B: Manualmente
```bash
# Conectar a MySQL
mysql -u root -p

# Ejecutar el script de inicialización
source init/data.sql
```

### 5. Compilar TypeScript
```bash
npm run build
```

## 🚀 Ejecución

### Desarrollo
```bash
npm run dev
```
El servidor se ejecutará en `http://localhost:3001` con recarga automática.

### Producción
```bash
npm start
```

## 📚 Documentación de la API

### Base URL
```
http://localhost:3001/api
```

### Autenticación
Todas las rutas (excepto health check) requieren autenticación JWT:
```
Authorization: Bearer <token>
```

### 📋 Endpoints de Órdenes

#### Crear Orden
```http
POST /api/orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "correo_usuario": "usuario@email.com",
  "nombre_completo": "Juan Pérez",
  "productos": [
    {
      "producto_id": 1,
      "cantidad": 2,
      "precio_unitario": 29.99
    }
  ]
}
```

#### Obtener Órdenes
```http
GET /api/orders?page=1&limit=10&estado=pendiente
Authorization: Bearer <token>
```

#### Obtener Orden por ID
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

#### Actualizar Orden
```http
PUT /api/orders/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "correo_usuario": "nuevo@email.com",
  "nombre_completo": "Juan Carlos Pérez"
}
```

#### Eliminar Orden (Solo Admin)
```http
DELETE /api/orders/:id
Authorization: Bearer <admin_token>
```

#### Estadísticas de Órdenes
```http
GET /api/orders/stats
Authorization: Bearer <token>
```

### 🔄 Endpoints de Estados

#### Actualizar Estado (Solo Admin)
```http
PUT /api/orders/:id/status
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "estado": "procesando",
  "motivo": "Orden confirmada y en preparación"
}
```

#### Historial de Estados
```http
GET /api/orders/:id/status/history
Authorization: Bearer <token>
```

#### Cancelar Orden
```http
PUT /api/orders/:id/cancel
Content-Type: application/json
Authorization: Bearer <token>

{
  "motivo": "Cliente solicitó cancelación"
}
```

#### Estadísticas de Estados
```http
GET /api/orders/status/stats
Authorization: Bearer <token>
```

### 🛍️ Endpoints de Productos en Órdenes

#### Agregar Producto a Orden
```http
POST /api/orders/:id/products
Content-Type: application/json
Authorization: Bearer <token>

{
  "producto_id": 2,
  "cantidad": 1,
  "precio_unitario": 15.99
}
```

#### Actualizar Producto en Orden
```http
PUT /api/orders/:orderId/products/:productId
Content-Type: application/json
Authorization: Bearer <token>

{
  "cantidad": 3,
  "precio_unitario": 14.99
}
```

#### Eliminar Producto de Orden
```http
DELETE /api/orders/:orderId/products/:productId
Authorization: Bearer <token>
```

#### Obtener Productos de Orden
```http
GET /api/orders/:id/products
Authorization: Bearer <token>
```

## 🔐 Estados de Órdenes

El sistema maneja los siguientes estados con transiciones controladas:

```
pendiente → procesando → enviado → entregado
    ↓           ↓
 cancelado   cancelado
```

### Estados Disponibles:
- **pendiente**: Orden creada, esperando procesamiento
- **procesando**: Orden en preparación
- **enviado**: Orden despachada
- **entregado**: Orden completada (estado final)
- **cancelado**: Orden cancelada (estado final)

## 🗄️ Estructura de la Base de Datos

### Tabla: orders
```sql
orden_id (PK) | user_id | correo_usuario | nombre_completo | estado | total | fecha_pago | fecha_entrega
```

### Tabla: order_products
```sql
id (PK) | orden_id (FK) | producto_id | cantidad | precio_unitario | subtotal
```

### Tabla: order_status_history
```sql
id (PK) | orden_id (FK) | estado_anterior | estado_nuevo | motivo | changed_by | changed_at
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Linting
npm run lint
npm run lint:fix
```

## 📁 Estructura del Proyecto

```
orders-service/
├── src/
│   ├── controllers/
│   │   ├── orders.controller.ts
│   │   ├── orderProducts.controller.ts
│   │   └── orderStatus.controller.ts
│   ├── middleware/
│   │   └── auth.ts
│   ├── routes/
│   │   ├── orders.routes.ts
│   │   └── orderStatus.routes.ts
│   ├── utils/
│   │   └── jwt.ts
│   ├── db.ts
│   └── index.ts
├── init/
│   └── data.sql
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Compilar TypeScript
- `npm start` - Ejecutar en producción
- `npm test` - Ejecutar tests
- `npm run lint` - Verificar código
- `npm run lint:fix` - Corregir errores de linting
- `npm run db:init` - Inicializar base de datos

## 🚨 Códigos de Error Comunes

- **400**: Datos inválidos o faltantes
- **401**: Token JWT inválido o faltante
- **403**: Permisos insuficientes
- **404**: Recurso no encontrado
- **409**: Conflicto (ej: transición de estado inválida)
- **500**: Error interno del servidor

## 🔒 Seguridad

- Autenticación JWT obligatoria
- Validación de entrada con Zod
- Control de acceso basado en roles
- Sanitización de consultas SQL
- Headers de seguridad configurados

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- Email: support@bytestore.com
- Issues: [GitHub Issues](https://github.com/bytestore/api/issues)

---

**ByteStore Orders Service** - Desarrollado con ❤️ por el equipo de ByteStore