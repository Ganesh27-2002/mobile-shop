import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
} from '../controllers/orderController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All order endpoints require authentication
router.use(authMiddleware);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);

export default router;
