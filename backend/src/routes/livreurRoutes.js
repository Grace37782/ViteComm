import { Router } from 'express';
import {
  getDriverDashboard,
  updateAvailability,
  getAvailableDeliveries,
  getMyDeliveries,
  finalizeDelivery,
  createSignalement
} from '../controllers/livreurController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['livreur']));

router.get('/dashboard', getDriverDashboard);
router.put('/availability', updateAvailability);                          // RG19
router.get('/deliveries/available', getAvailableDeliveries);             // RG05 - marketplace
router.get('/deliveries', getMyDeliveries);
router.post('/deliveries/:id_commande/finalize', finalizeDelivery);      // RG06, RG09, RG16
router.post('/signalements', createSignalement);                          // RG14

export default router;

