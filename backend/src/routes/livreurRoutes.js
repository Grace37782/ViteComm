import { Router } from 'express';
import {
  getDriverDashboard,
  updateAvailability,
  getAvailabilityHistory,
  getAvailableDeliveries,
  acceptDelivery,
  collectDelivery,
  departDelivery,
  finalizeDelivery,
  getMyDeliveries,
  getLivreurHistorique,
  getReturns,
  getLivreurRetours,
  updateReturnStatus,
  getGainsDetailed,
  getFeedbacks,
  getLivreurProfil,
  updateLivreurProfil,
  createSignalement,
  verifyCollectQR,
  verifyFinalizeQR
} from '../controllers/livreurController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadAvatar } from '../middleware/upload.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['livreur']));

// ── Dashboard ──
router.get('/dashboard', getDriverDashboard);

// ── Disponibilité (RG19, RG29) ──
router.put('/availability', updateAvailability);
router.get('/availability/history', getAvailabilityHistory);

// ── Profil ──
router.get('/profil', getLivreurProfil);
router.put('/profil', uploadAvatar, updateLivreurProfil);

// ── Courses disponibles (RG05) ──
router.get('/deliveries/available', getAvailableDeliveries);
router.post('/deliveries/:id_commande/accept', acceptDelivery);

// ── Flux de livraison ──
router.get('/deliveries', getMyDeliveries);
router.get('/historique', getLivreurHistorique);
router.post('/deliveries/:id_commande/verify-collect', verifyCollectQR);
router.post('/deliveries/:id_commande/collect', collectDelivery);
router.post('/deliveries/:id_commande/depart', departDelivery);
router.post('/deliveries/:id_commande/verify-finalize', verifyFinalizeQR);
router.post('/deliveries/:id_commande/finalize', finalizeDelivery);

// ── Retours (RG09, RG16) ──
router.get('/returns', getReturns);
router.get('/retours', getLivreurRetours);
router.put('/returns/:id_litige', updateReturnStatus);

// ── Gains (RG28) ──
router.get('/gains', getGainsDetailed);

// ── Avis clients (RG10) ──
router.get('/feedbacks', getFeedbacks);

// ── Signalement (RG14) ──
router.post('/signalements', createSignalement);

export default router;
