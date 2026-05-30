import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  getVendorDashboard,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getVendorOrders,
  verifyHandover,
  getVendorReturns,
  createSignalement
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

router.get('/dashboard', getVendorDashboard);
router.get('/products', getMyProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/orders', getVendorOrders);
router.post('/orders/:id_commande/verify-handover', upload.single('photo'), verifyHandover);
router.get('/returns', getVendorReturns);
router.post('/signalements', createSignalement);  // RG14

export default router;

