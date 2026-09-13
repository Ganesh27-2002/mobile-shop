import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { testAdmin } from '../controllers/adminController.js';
import * as adminDashboardController from '../controllers/adminDashboardController.js';
import * as adminProductController from '../controllers/adminProductController.js';
import * as adminCategoryController from '../controllers/adminCategoryController.js';
import * as adminInventoryController from '../controllers/adminInventoryController.js';
import * as adminOrderController from '../controllers/adminOrderController.js';
import * as adminCustomerController from '../controllers/adminCustomerController.js';

const router = Router();

// Apply authMiddleware and adminMiddleware to ALL admin routes
router.use(authMiddleware, adminMiddleware);

// Test endpoint
router.get('/test', testAdmin);

// ==========================================
// Dashboard Endpoint
// ==========================================
router.get('/dashboard', adminDashboardController.getDashboardStats);

// ==========================================
// Products Endpoints
// ==========================================
router.get('/products/images', adminProductController.getAllowedImages);
router.get('/products', adminProductController.getProducts);
router.post('/products', adminProductController.createProduct);
router.get('/products/:id', adminProductController.getProductById);
router.put('/products/:id', adminProductController.updateProduct);
router.patch('/products/:id/status', adminProductController.updateProductStatus);
router.patch('/products/:id/stock', adminProductController.updateProductStock);
router.delete('/products/:id', adminProductController.deleteProduct);

// ==========================================
// Inventory Endpoint
// ==========================================
router.get('/inventory', adminInventoryController.getInventory);

// ==========================================
// Categories Endpoints
// ==========================================
router.get('/categories', adminCategoryController.getCategories);
router.post('/categories', adminCategoryController.createCategory);
router.get('/categories/:id', adminCategoryController.getCategoryById);
router.put('/categories/:id', adminCategoryController.updateCategory);
router.delete('/categories/:id', adminCategoryController.deleteCategory);

// ==========================================
// Orders Endpoints
// ==========================================
router.get('/orders', adminOrderController.getOrders);
router.get('/orders/:id', adminOrderController.getOrderById);
router.patch('/orders/:id/status', adminOrderController.updateOrderStatus);

// ==========================================
// Customers Endpoints
// ==========================================
router.get('/customers', adminCustomerController.getCustomers);
router.get('/customers/:id', adminCustomerController.getCustomerById);

export default router;
