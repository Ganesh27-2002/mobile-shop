import { Router } from 'express';
import { getCheckoutSummary } from '../controllers/checkoutController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Checkout endpoints require authentication
router.use(authMiddleware);

router.get('/summary', getCheckoutSummary);

export default router;
