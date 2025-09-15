import { Router } from 'express';
import {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
} from '../controllers/reviews.controller';
import { authMiddleware, canAccessResource } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET / - Obtener reviews paginadas
router.get('/', getReviews);

// POST / - Crear nueva review
router.post('/', createReview);

// GET /:id - Obtener review por ID
router.get('/:id', getReviewById);

// PUT /:id - Actualizar review (solo propietario o admin)
router.put('/:id', canAccessResource, updateReview);

// DELETE /:id - Eliminar review (solo propietario o admin)
router.delete('/:id', canAccessResource, deleteReview);

export default router;
