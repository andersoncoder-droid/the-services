import express from 'express';
import ordersRoutes from './routes/orders.routes.js';
import orderStatusRoutes from './routes/orderStatus.routes.js';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import { testConnection } from './db.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Configuración de CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(morgan('dev')); // Logging de requests
app.use(cors(corsOptions)); // CORS
app.use(express.json({ limit: '10mb' })); // Parser JSON
app.use(express.urlencoded({ extended: true })); // Parser URL-encoded

// Rutas principales
app.use('/', ordersRoutes);
app.use('/', orderStatusRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'orders-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Ruta raíz con información del servicio
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'ByteStore Orders Service API',
    version: '1.0.0',
    description: 'Microservicio para gestión de órdenes de compra',
    endpoints: {
      orders: '/orders',
      health: '/health',
    },
    documentation: 'Ver README.md para más información',
  });
});

// Middleware de manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method,
  });
});

// Middleware de manejo de errores globales
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Error no manejado:', err);
    res.status(500).json({
      message: 'Error interno del servidor',
      error:
        process.env.NODE_ENV === 'development' ? err.message : 'Error interno',
    });
  }
);

// Función para iniciar el servidor
async function startServer() {
  try {
    // Probar conexión a la base de datos
    console.log('🔍 Probando conexión a la base de datos...');
    await testConnection();
    console.log('✅ Conexión a la base de datos exitosa');

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Orders Service ejecutándose en puerto ${PORT}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📦 Orders API: http://localhost:${PORT}/orders`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});

// Iniciar el servidor
startServer();

export default app;
