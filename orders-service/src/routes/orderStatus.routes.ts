import { Router } from 'express';
import {
  updateOrderStatus,
  getOrderStatusHistory,
  cancelOrder,
  getOrderStatusStats,
} from '../controllers/orderStatus.controller.js';
import { authMiddleware, isAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * @route PUT /api/orders/:id/status
 * @desc Actualizar estado de una orden (solo administradores)
 * @access Private (Admin)
 */
router.put('/:id/status', authMiddleware, isAdmin, updateOrderStatus);

/**
 * @route GET /api/orders/:id/status/history
 * @desc Obtener historial de cambios de estado de una orden
 * @access Private (Owner or Admin)
 */
router.get('/:id/status/history', authMiddleware, getOrderStatusHistory);

/**
 * @route PUT /api/orders/:id/cancel
 * @desc Cancelar una orden
 * @access Private (Owner or Admin)
 */
router.put('/:id/cancel', authMiddleware, cancelOrder);

/**
 * @route GET /api/orders/status/stats
 * @desc Obtener estadísticas de estados de órdenes
 * @access Private
 */
router.get('/status/stats', authMiddleware, getOrderStatusStats);

export default router;