import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getProducts,
  getProductPriceHistory,
  getVendors,
  getVendorById,
  getCategories,
  getDrivers,
  getUserById,
  getCart,
  upsertCartItem,
  clearCart,
  createOrder,
  getMyOrders,
  createFeedback,
  createSignalement,
  inspectionOrder,
  getMarkets,
  getMarketById,
  getOrderQRCode,
  getFinalizeQRCode,
  getOrderFacture,
  getClientFactures,
  cancelOrder
} from '../controllers/clientController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getFinalizeScanStatus } from '../controllers/livreurController.js';

const router = Router();

// Multer for inspection proof photos
const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads/proofs');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const uploadProof = multer({
  storage: proofStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Seules les images et vidéos sont acceptées.'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Public product browsing
router.get('/products', requireAuth, requireRole(['client']), getProducts);
router.get('/products/:id_produit/price-history', requireAuth, requireRole(['client']), getProductPriceHistory); // RG24

// Localmarts (markets)
router.get('/markets', requireAuth, requireRole(['client']), getMarkets);
router.get('/markets/:id', requireAuth, requireRole(['client']), getMarketById);

// Vendor stalls for AccueilClient & Catalogue
router.get('/vendors', requireAuth, requireRole(['client']), getVendors);
router.get('/vendors/:id', requireAuth, requireRole(['client']), getVendorById);

// Categories
router.get('/categories', requireAuth, requireRole(['client']), getCategories);

// Driver selection for checkout
router.get('/drivers', requireAuth, requireRole(['client']), getDrivers);

// User profile detail (driver/vendor/client)
router.get('/users/:id', requireAuth, requireRole(['client']), getUserById);

// Cart management (RG22)
router.get('/cart', requireAuth, requireRole(['client']), getCart);
router.post('/cart/item', requireAuth, requireRole(['client']), upsertCartItem);
router.delete('/cart', requireAuth, requireRole(['client']), clearCart);

// Orders
router.post('/orders', requireAuth, requireRole(['client']), createOrder);
router.get('/orders', requireAuth, requireRole(['client']), getMyOrders);
router.post('/orders/:id_commande/inspection', requireAuth, requireRole(['client']), uploadProof.array('photos', 5), inspectionOrder);
router.get('/orders/:id_commande/qrcode', requireAuth, requireRole(['client']), getOrderQRCode);
router.get('/orders/:id_commande/finalize-qrcode', requireAuth, requireRole(['client']), getFinalizeQRCode);
router.get('/orders/:id_commande/scan-status', requireAuth, requireRole(['client']), getFinalizeScanStatus);
router.post('/orders/:id_commande/cancel', requireAuth, requireRole(['client']), cancelOrder);
router.get('/orders/:id_commande/facture', requireAuth, requireRole(['client']), getOrderFacture);
router.get('/factures', requireAuth, requireRole(['client']), getClientFactures);

// Feedback (RG23)
router.post('/feedbacks', requireAuth, requireRole(['client']), createFeedback);

// Signalement (RG14: universal)
router.post('/signalements', requireAuth, createSignalement);

export default router;

