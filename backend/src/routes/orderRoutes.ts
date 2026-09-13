import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  trackOrder,
  cancelOrder,
} from '../controllers/orderController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All order endpoints require authentication
router.use(authMiddleware);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.get('/:id/tracking', trackOrder);
router.post('/:id/cancel', cancelOrder);

export default router;
