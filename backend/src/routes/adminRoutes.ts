import { Router } from 'express';
import { testAdmin } from '../controllers/adminController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();

// GET /api/admin/test - Test endpoint protected by Auth + Admin middlewares
router.get('/test', authMiddleware, adminMiddleware, testAdmin);

export default router;
