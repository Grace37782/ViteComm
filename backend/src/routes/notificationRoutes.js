import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getNotifications,
  markAsRead,
  subscribePush,
  unsubscribePush,
  getVapidKey,
} from '../controllers/notificationController.js';

const router = Router();

router.get('/', requireAuth, getNotifications);
router.post('/read', requireAuth, markAsRead);
router.post('/push/subscribe', requireAuth, subscribePush);
router.post('/push/unsubscribe', requireAuth, unsubscribePush);
router.get('/push/vapid-key', requireAuth, getVapidKey);

export default router;
