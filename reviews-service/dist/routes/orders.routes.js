import { Router } from "express";
import { createOrder, getOrders, getOrderById, updateOrder, deleteOrder, } from "../controllers/orders.controller.js";
import { authMiddleware, isAdmin } from "../middleware/auth.js";
const router = Router();
// Todas las rutas requieren autenticación
router.use(authMiddleware);
// GET / - Obtener órdenes paginadas
router.get("/", getOrders);
// POST / - Crear nueva orden
router.post("/", createOrder);
// GET /:id - Obtener orden por ID
router.get("/:id", getOrderById);
// PUT /:id - Actualizar orden
router.put("/:id", updateOrder);
// DELETE /:id - Eliminar orden (solo admin)
router.delete("/:id", isAdmin, deleteOrder);
export default router;
//# sourceMappingURL=orders.routes.js.map