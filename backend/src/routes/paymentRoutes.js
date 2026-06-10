import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { createPayment, getPaymentStatus, handleCallback } from '../controllers/paymentController.js';

const router = Router();

router.post('/initiate', requireAuth, requireRole(['client']), createPayment);
router.get('/status/:transaction_id', requireAuth, requireRole(['client']), getPaymentStatus);
router.get('/callback', handleCallback);

export default router;
