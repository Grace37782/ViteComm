import { Router } from 'express';
import { getDriverDashboard, getMyDeliveries, finalizeDelivery } from '../controllers/livreurController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['livreur']));

router.get('/dashboard', getDriverDashboard);
router.get('/deliveries', getMyDeliveries);
router.post('/deliveries/:id_commande/finalize', finalizeDelivery);

export default router;
