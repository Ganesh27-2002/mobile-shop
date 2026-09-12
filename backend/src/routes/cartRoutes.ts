import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
} from '../controllers/cartController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All cart endpoints require authentication
router.use(authMiddleware);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/items/:id', updateCartItem);
router.delete('/items/:id', removeCartItem);

export default router;
