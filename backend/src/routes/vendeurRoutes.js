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
  uploadProductPhoto,
  getVendorCategories,
  createCategory,
  getVendorOrders,
  validateOrder,
  getOrderQRCode,
  getVendorReturns,
  markReturnRecovered,
  getVendorStatistiques,
  getVendorFactures,
  getVendorFactureSummary,
  getVendorFactureDetail,
  recordPayment,
  updateFactureStatus,
  getVendorPriceHistory,
  getVendorSignalements,
  createSignalement,
  deleteSignalement,
  getVendorProfil,
  updateVendorProfil
} from '../controllers/vendeurController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

// Configure Multer for file uploads
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
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
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
router.post('/products/:id/photo', upload.single('photo'), uploadProductPhoto);

// Catégories (RG30, RG31)
router.get('/categories', getVendorCategories);
router.post('/categories', createCategory);

// Commandes
router.get('/orders', getVendorOrders);
router.post('/orders/:id_commande/validate', validateOrder);
router.get('/orders/:id_commande/qrcode', getOrderQRCode);

// Retours
router.get('/returns', getVendorReturns);
router.put('/returns/:id_commande/:id_produit/recover', markReturnRecovered);

// Statistiques
router.get('/statistiques', getVendorStatistiques);

// Factures & Paiements (RG25, RG26)
router.get('/factures', getVendorFactures);
router.get('/factures/summary', getVendorFactureSummary);
router.get('/factures/:id', getVendorFactureDetail);
router.post('/factures/:id/payment', recordPayment);
router.put('/factures/:id/status', updateFactureStatus);

// Historique des Prix
router.get('/price-history', getVendorPriceHistory);

// Signalements
router.get('/signalements', getVendorSignalements);
router.post('/signalements', createSignalement);
router.delete('/signalements/:id', deleteSignalement);

// Profil
router.get('/profil', getVendorProfil);
router.put('/profil', upload.single('photo'), updateVendorProfil);

export default router;
