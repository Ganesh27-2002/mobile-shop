import { Router } from 'express';
import { getProducts, getProductById } from '../controllers/productController.js';

const router = Router();

// Public Product Endpoints
router.get('/', getProducts);
router.get('/:id', getProductById);

export default router;
