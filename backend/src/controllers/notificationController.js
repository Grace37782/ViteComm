import prisma from '../config/db.js';
import { internalError } from '../utils/errors.js';

export async function getNotifications(req, res) {
  try {
    const userId = req.user.id_user;
    const notifications = await prisma.notification.findMany({
      where: { id_user: userId },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    const unreadCount = await prisma.notification.count({
      where: { id_user: userId, lu: false },
    });
    return res.json({ notifications, unreadCount });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
}

export async function markAsRead(req, res) {
  try {
    const userId = req.user.id_user;
    const { ids } = req.body; // array of notification ids, or empty to mark all
    if (ids && ids.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: ids }, id_user: userId },
        data: { lu: true },
      });
    } else {
      await prisma.notification.updateMany({
        where: { id_user: userId, lu: false },
        data: { lu: true },
      });
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
}

export async function subscribePush(req, res) {
  try {
    const userId = req.user.id_user;
    const { endpoint, p256dh, auth } = req.body;
    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({ error: 'Données d\'abonnement manquantes.' });
    }
    await prisma.pushSubscription.upsert({
      where: { endpoint_id_user: { endpoint, id_user: userId } },
      update: { p256dh, auth },
      create: { endpoint, p256dh, auth, id_user: userId },
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
}

export async function unsubscribePush(req, res) {
  try {
    const userId = req.user.id_user;
    const { endpoint } = req.body;
    if (endpoint) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint, id_user: userId },
      });
    } else {
      await prisma.pushSubscription.deleteMany({
        where: { id_user: userId },
      });
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
}

export async function getVapidKey(req, res) {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) return res.status(503).json({ error: 'Push notifications not configured.' });
  return res.json({ publicKey: key });
}
