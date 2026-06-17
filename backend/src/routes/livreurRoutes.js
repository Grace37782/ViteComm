import { Router } from 'express';
import multer from 'multer';
import path from 'path';
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
  createSignalement
} from '../controllers/livreurController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['livreur']));

// Configure multer for profile photo
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const uploadPhoto = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Seules les images sont acceptées.'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ── Dashboard ──
router.get('/dashboard', getDriverDashboard);

// ── Disponibilité (RG19, RG29) ──
router.put('/availability', updateAvailability);
router.get('/availability/history', getAvailabilityHistory);

// ── Profil ──
router.get('/profil', getLivreurProfil);
router.put('/profil', uploadPhoto.single('photo'), updateLivreurProfil);

// ── Courses disponibles (RG05) ──
router.get('/deliveries/available', getAvailableDeliveries);
router.post('/deliveries/:id_commande/accept', acceptDelivery);

// ── Flux de livraison ──
router.get('/deliveries', getMyDeliveries);
router.get('/historique', getLivreurHistorique);
router.post('/deliveries/:id_commande/collect', collectDelivery);
router.post('/deliveries/:id_commande/depart', departDelivery);
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
