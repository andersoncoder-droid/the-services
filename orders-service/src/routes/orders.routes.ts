import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getOrderStats,
} from '../controllers/orders.controller.js';
import { authMiddleware, isAdmin } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET / - Obtener órdenes paginadas con filtros
router.get('/', getOrders);

// POST / - Crear nueva orden
router.post('/', createOrder);

// GET /stats - Obtener estadísticas de órdenes del usuario
router.get('/stats', getOrderStats);

// GET /:id - Obtener orden por ID
router.get('/:id', getOrderById);

// PUT /:id - Actualizar orden (estado solo admin, dirección propietario/admin)
router.put('/:id', updateOrder);

// DELETE /:id - Eliminar orden (solo admin)
router.delete('/:id', isAdmin, deleteOrder);

export default router;