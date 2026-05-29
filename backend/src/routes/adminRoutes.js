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
  getPriceHistory,
  getAllProducts,
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
router.get('/me', getAdminMe);
router.put('/profile', updateAdminProfile);

// User management (RG12, RG13)
router.get('/users', getUsers);
router.put('/users/:id_user/status', updateUserStatus);
router.delete('/users/:id_user', deleteUser);                            // RG13
router.get('/users/:id_user/catalogue', getVendorCatalogue);             // RG12
router.get('/users/:id_user/details', getUserDetails);                  // User detail with reputation & role data

// Product list & price history audit (RG24)
router.get('/products', getAllProducts);
router.get('/products/:id_produit/price-history', getPriceHistory);

// Signalements (RG14)
router.get('/signalements', getSignalements);
router.put('/signalements/:id_signalement', updateSignalementStatus);

// Litiges (RG09, RG16, RG21)
router.get('/litiges', getLitiges);
router.put('/litiges/:id_litige/resolve', resolveLitige);

export default router;

