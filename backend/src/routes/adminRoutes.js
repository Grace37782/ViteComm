import { Router } from 'express';
import {
  getAdminDashboard,
  getUsers,
  updateUserStatus,
  getSignalements,
  updateSignalementStatus,
  getLitiges,
  resolveLitige
} from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['admin']));

router.get('/dashboard', getAdminDashboard);
router.get('/users', getUsers);
router.put('/users/:id_user/status', updateUserStatus);
router.get('/signalements', getSignalements);
router.put('/signalements/:id_signalement', updateSignalementStatus);
router.get('/litiges', getLitiges);
router.put('/litiges/:id_litige/resolve', resolveLitige);

export default router;
