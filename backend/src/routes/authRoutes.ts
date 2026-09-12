import { Router } from 'express';
import { signup, login, getMe } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateRequest, signupSchema, loginSchema } from '../validators/authValidator.js';

const router = Router();

// POST /api/auth/signup - Register new user
router.post('/signup', validateRequest(signupSchema), signup);

// POST /api/auth/login - Authenticate user & return JWT
router.post('/login', validateRequest(loginSchema), login);

// GET /api/auth/me - Retrieve current logged-in user (Protected)
router.get('/me', authMiddleware, getMe);

export default router;
