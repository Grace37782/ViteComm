import { Router } from 'express';
import {
  getAdminDashboard,
  getUsers,
  getUserDetails,
  updateUserStatus,
  getAdminMe,
  updateAdminProfile,
  deleteUser,
  getVendorCatalogue,
  getAllProducts,
  getPriceHistory,
  getSignalements,
  updateSignalementStatus,
  getLitiges,
  resolveLitige,
  createMarket,
  updateMarket,
  deleteMarket,
  getMarketsAdmin
} from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadAvatar, uploadMarketImage } from '../middleware/upload.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['admin']));

router.get('/dashboard', getAdminDashboard);
router.get('/me', getAdminMe);
router.put('/profile', uploadAvatar, updateAdminProfile);

// Market management by admin
router.get('/markets', getMarketsAdmin);
router.post('/markets', uploadMarketImage, createMarket);
router.put('/markets/:id', uploadMarketImage, updateMarket);
router.delete('/markets/:id', deleteMarket);

// User management (RG12, RG13)
router.get('/users', getUsers);
router.put('/users/:id_user/status', updateUserStatus);
router.delete('/users/:id_user', deleteUser);                            // RG13
router.get('/users/:id_user/catalogue', getVendorCatalogue);             // RG12
router.get('/users/:id_user/details', getUserDetails);                  // User detail with reputation & role data

// All products — full platform inventory (for Products tab) and price history audit (RG24)
router.get('/products', getAllProducts);
router.get('/products/:id_produit/price-history', getPriceHistory);

// Signalements (RG14)
router.get('/signalements', getSignalements);
router.put('/signalements/:id_signalement', updateSignalementStatus);

// Litiges (RG09, RG16, RG21)
router.get('/litiges', getLitiges);
router.put('/litiges/:id_litige/resolve', resolveLitige);

export default router;

