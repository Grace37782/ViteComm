import { Router } from 'express';
import {
  getProducts,
  getProductPriceHistory,
  getVendors,
  getVendorById,
  getCategories,
  getDrivers,
  getCart,
  upsertCartItem,
  clearCart,
  createOrder,
  getMyOrders,
  createFeedback,
  createSignalement,
  getMarkets,
  getMarketById
} from '../controllers/clientController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

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

// Cart management (RG22)
router.get('/cart', requireAuth, requireRole(['client']), getCart);
router.post('/cart/item', requireAuth, requireRole(['client']), upsertCartItem);
router.delete('/cart', requireAuth, requireRole(['client']), clearCart);

// Orders
router.post('/orders', requireAuth, requireRole(['client']), createOrder);
router.get('/orders', requireAuth, requireRole(['client']), getMyOrders);

// Feedback (RG23)
router.post('/feedbacks', requireAuth, requireRole(['client']), createFeedback);

// Signalement (RG14: universal)
router.post('/signalements', requireAuth, createSignalement);

export default router;

