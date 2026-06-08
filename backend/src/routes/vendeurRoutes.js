import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  getVendorDashboard,
  getVendorRecentOrders,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getVendorOrders,
  verifyHandover,
  getVendorReturns,
  getVendorStatistiques,
  getVendorFactures,
  getVendorPriceHistory,
  getVendorSignalements,
  createSignalement,
  getVendorProfil,
  updateVendorProfil
} from '../controllers/vendeurController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

// Configure Multer for proof photo uploads (RG07)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Seules les images (jpeg, jpg, png, webp) sont autorisées.'));
  }
});

const router = Router();

router.use(requireAuth);
router.use(requireRole(['vendeur']));

// Dashboard
router.get('/dashboard', getVendorDashboard);
router.get('/recent-orders', getVendorRecentOrders);

// Catalogue (CRUD)
router.get('/products', getMyProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Commandes
router.get('/orders', getVendorOrders);
router.post('/orders/:id_commande/verify-handover', upload.single('photo'), verifyHandover);

// Retours
router.get('/returns', getVendorReturns);

// Statistiques
router.get('/statistiques', getVendorStatistiques);

// Factures & Paiements
router.get('/factures', getVendorFactures);

// Historique des Prix
router.get('/price-history', getVendorPriceHistory);

// Signalements
router.get('/signalements', getVendorSignalements);
router.post('/signalements', createSignalement);

// Profil
router.get('/profil', getVendorProfil);
router.put('/profil', updateVendorProfil);

export default router;
