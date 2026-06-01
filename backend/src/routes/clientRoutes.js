import { Router } from 'express';
import {
  getProducts,
  getProductPriceHistory,
  getVendors,
  getCategories,
  getDrivers,
  getCart,
  upsertCartItem,
  clearCart,
  createOrder,
  getMyOrders,
  createFeedback,
  createSignalement
} from '../controllers/clientController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Public product browsing
router.get('/products', requireAuth, requireRole(['client']), getProducts);
router.get('/products/:id_produit/price-history', requireAuth, requireRole(['client']), getProductPriceHistory); // RG24

// Vendor stalls for AccueilClient
router.get('/vendors', requireAuth, requireRole(['client']), getVendors);

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

