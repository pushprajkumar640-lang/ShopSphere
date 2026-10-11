import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import * as auth from '../controllers/authController.js';
import * as products from '../controllers/productController.js';
import * as orders from '../controllers/orderController.js';
import * as admin from '../controllers/adminController.js';
import * as s from '../validators/schemas.js';

const router = Router();
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Auth
router.post('/auth/register', validate(s.registerSchema), asyncHandler(auth.register));
router.post('/auth/login', validate(s.loginSchema), asyncHandler(auth.login));
router.get('/auth/me', requireAuth, asyncHandler(auth.me));

// Catalog (public)
router.get('/categories', asyncHandler(products.listCategories));
router.get('/products', validate(s.productQuerySchema, 'query'), asyncHandler(products.listProducts));
router.get('/products/:id', validate(s.idParamSchema, 'params'), asyncHandler(products.getProduct));

// Orders (authenticated customer)
router.post('/orders', requireAuth, validate(s.checkoutSchema), asyncHandler(orders.placeOrder));
router.get('/orders/mine', requireAuth, asyncHandler(orders.myOrders));
router.get('/orders/mine/:id', requireAuth, validate(s.idParamSchema.extend({ id: z.string().uuid() }), 'params'), asyncHandler(orders.getMyOrder));

// Admin (server-side enforced)
const adminOnly = [requireAuth, requireAdmin];
router.get('/admin/stats', ...adminOnly, asyncHandler(admin.stats));
router.get('/admin/orders', ...adminOnly, asyncHandler(orders.allOrders));
router.post('/admin/products', ...adminOnly, validate(s.productInputSchema), asyncHandler(products.createProduct));
router.patch('/admin/products/:id', ...adminOnly, validate(s.idParamSchema, 'params'), validate(s.productUpdateSchema), asyncHandler(products.updateProduct));
router.delete('/admin/products/:id', ...adminOnly, validate(s.idParamSchema, 'params'), asyncHandler(products.deleteProduct));

export default router;
