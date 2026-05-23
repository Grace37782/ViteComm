import { Router } from 'express';
import { getProducts, getDrivers, createOrder, getMyOrders, createFeedback, createSignalement } from '../controllers/clientController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/products', requireAuth, requireRole(['client']), getProducts);
router.get('/drivers', requireAuth, requireRole(['client']), getDrivers);
router.post('/orders', requireAuth, requireRole(['client']), createOrder);
router.get('/orders', requireAuth, requireRole(['client']), getMyOrders);
router.post('/feedbacks', requireAuth, requireRole(['client']), createFeedback);
router.post('/signalements', requireAuth, createSignalement); // RG14: Universel

export default router;
