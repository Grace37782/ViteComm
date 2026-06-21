import prisma from '../config/db.js';
import webpush from 'web-push';
import nodemailer from 'nodemailer';

// ─── Nodemailer transport ───
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: false,
  auth: { user: process.env.MAIL_USERNAME, pass: process.env.MAIL_PASSWORD },
});

// ─── Web Push setup ───
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:noreply@vitecomm.com';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

// ─── Email templates ───
const EMAIL_WRAP = (title, body) => `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#1D9E75,#0F6E56);padding:24px;border-radius:16px 16px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:20px;">ViteComm</h1>
  </div>
  <div style="background:#fff;border:1px solid #E8E6DF;padding:24px;border-radius:0 0 16px 16px;">
    <h2 style="font-size:16px;color:#2C2C2A;margin:0 0 12px;">${title}</h2>
    ${body}
    <hr style="border:none;border-top:1px solid #E8E6DF;margin:20px 0;">
    <p style="font-size:12px;color:#888780;text-align:center;">Équipe ViteComm</p>
  </div>
</div>`;

const emailTemplates = {
  order_placed: (data) => ({
    subject: `Nouvelle commande #${data.orderId}`,
    html: EMAIL_WRAP('Nouvelle commande reçue !', `
      <p style="font-size:14px;color:#5F5E5A;">Bonjour ${data.vendorName},</p>
      <p style="font-size:14px;color:#5F5E5A;">Un client a passé une commande contenant vos articles :</p>
      <div style="background:#F3FAF7;padding:12px;border-radius:8px;margin:12px 0;">
        <p style="font-size:13px;color:#2C2C2A;margin:0;"><strong>Commande #${data.orderId}</strong></p>
        <p style="font-size:13px;color:#5F5E5A;margin:4px 0 0;">${data.items}</p>
        <p style="font-size:13px;color:#1D9E75;font-weight:700;margin:4px 0 0;">${data.total} F</p>
      </div>
      <p style="font-size:13px;color:#888780;">Ouvrez l'application pour valider cette commande.</p>
    `),
  }),

  order_validated: (data) => ({
    subject: `Commande #${data.orderId} validée`,
    html: EMAIL_WRAP('Commande validée par le vendeur', `
      <p style="font-size:14px;color:#5F5E5A;">Bonjour ${data.clientName},</p>
      <p style="font-size:14px;color:#5F5E5A;">Le vendeur <strong>${data.vendorName}</strong> a validé votre commande <strong>#${data.orderId}</strong>.</p>
      <p style="font-size:13px;color:#888780;">Un livreur sera bientôt assigné à votre commande.</p>
    `),
  }),

  driver_assigned: (data) => ({
    subject: `Livreur assigné — Commande #${data.orderId}`,
    html: EMAIL_WRAP('Votre livreur est en route !', `
      <p style="font-size:14px;color:#5F5E5A;">Bonjour ${data.clientName},</p>
      <p style="font-size:14px;color:#5F5E5A;"><strong>${data.driverName}</strong> a accepté la livraison de votre commande <strong>#${data.orderId}</strong>.</p>
      <p style="font-size:13px;color:#888780;">Le livreur se rend chez les vendeurs pour collecter vos articles.</p>
    `),
  }),

  delivery_status: (data) => ({
    subject: `Mise à jour — Commande #${data.orderId}`,
    html: EMAIL_WRAP('Statut de livraison mis à jour', `
      <p style="font-size:14px;color:#5F5E5A;">Bonjour ${data.clientName},</p>
      <p style="font-size:14px;color:#5F5E5A;">Le statut de votre commande <strong>#${data.orderId}</strong> a changé :</p>
      <div style="background:#F3FAF7;padding:12px;border-radius:8px;margin:12px 0;text-align:center;">
        <p style="font-size:16px;color:#1D9E75;font-weight:700;margin:0;">${data.status}</p>
      </div>
    `),
  }),

  payment_received: (data) => ({
    subject: `Paiement reçu — Commande #${data.orderId}`,
    html: EMAIL_WRAP('Paiement confirmé !', `
      <p style="font-size:14px;color:#5F5E5A;">Bonjour ${data.recipientName},</p>
      <p style="font-size:14px;color:#5F5E5A;">Le paiement de la commande <strong>#${data.orderId}</strong> a été confirmé :</p>
      <div style="background:#F3FAF7;padding:12px;border-radius:8px;margin:12px 0;text-align:center;">
        <p style="font-size:20px;color:#1D9E75;font-weight:700;margin:0;">${data.amount} F</p>
        <p style="font-size:12px;color:#888780;margin:4px 0 0;">via ${data.method}</p>
      </div>
    `),
  }),

  feedback_received: (data) => ({
    subject: `Nouvel avis — Commande #${data.orderId}`,
    html: EMAIL_WRAP('Un client a laissé un avis', `
      <p style="font-size:14px;color:#5F5E5A;">Bonjour ${data.vendorName},</p>
      <p style="font-size:14px;color:#5F5E5A;">Un client a évalué la commande <strong>#${data.orderId}</strong> :</p>
      <div style="background:#F3FAF7;padding:12px;border-radius:8px;margin:12px 0;">
        <p style="font-size:14px;color:#2C2C2A;margin:0;">${'★'.repeat(data.rating)}${'☆'.repeat(5 - data.rating)}</p>
        ${data.comment ? `<p style="font-size:13px;color:#5F5E5A;margin:8px 0 0;font-style:italic;">"${data.comment}"</p>` : ''}
      </div>
    `),
  }),
};

// ─── Core notification function ───
export async function createNotification({ userId, titre, message, type, reference }) {
  try {
    return await prisma.notification.create({
      data: { id_user: userId, titre, message, type, reference: reference || null },
    });
  } catch (err) {
    console.error('[Notification] DB write failed:', err.message);
  }
}

// ─── Send email ───
async function sendEmail(email, subject, html) {
  const fromName = process.env.MAIL_FROM_NAME || 'ViteComm';
  const fromAddr = process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME;
  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to: email, subject, html,
    });
  } catch (err) {
    console.error('[Email] Send failed:', err.message);
  }
}

// ─── Send push notification ───
async function sendPush(userId, titre, body, url) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;
  try {
    const subs = await prisma.pushSubscription.findMany({ where: { id_user: userId } });
    const payload = JSON.stringify({ title: titre, body, url: url || '/' });
    const failedIds = [];
    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) failedIds.push(sub.id);
        }
      })
    );
    if (failedIds.length > 0) {
      await prisma.pushSubscription.deleteMany({ where: { id: { in: failedIds } } });
    }
  } catch (err) {
    console.error('[Push] Send failed:', err.message);
  }
}

// ─── High-level notification dispatchers ───

export async function notifyOrderPlaced(order, vendorUserId, vendorName, clientName, items, total) {
  const titre = `Nouvelle commande #${order.id_commande}`;
  const message = `${clientName} a passé une commande de ${total} F`;
  const ref = `order:${order.id_commande}`;
  await createNotification({ userId: vendorUserId, titre, message, type: 'order', reference: ref });
  await sendPush(vendorUserId, titre, message, `/vendor/commandes`);
  const vendor = await prisma.utilisateur.findUnique({ where: { id_user: vendorUserId }, select: { email: true } });
  if (vendor) {
    const tpl = emailTemplates.order_placed({ orderId: order.id_commande, vendorName, items, total: total.toLocaleString() });
    await sendEmail(vendor.email, tpl.subject, tpl.html);
  }
}

export async function notifyOrderValidated(order, clientUserId, clientName, vendorName) {
  const titre = `Commande #${order.id_commande} validée`;
  const message = `${vendorName} a validé votre commande`;
  const ref = `order:${order.id_commande}`;
  await createNotification({ userId: clientUserId, titre, message, type: 'order', reference: ref });
  await sendPush(clientUserId, titre, message, `/client/suivi-commande?id=${order.id_commande}`);
  const client = await prisma.utilisateur.findUnique({ where: { id_user: clientUserId }, select: { email: true } });
  if (client) {
    const tpl = emailTemplates.order_validated({ orderId: order.id_commande, clientName, vendorName });
    await sendEmail(client.email, tpl.subject, tpl.html);
  }
}

export async function notifyDriverAssigned(order, clientUserId, clientName, driverName) {
  const titre = `Livreur assigné — #${order.id_commande}`;
  const message = `${driverName} a accepté votre livraison`;
  const ref = `delivery:${order.id_commande}`;
  await createNotification({ userId: clientUserId, titre, message, type: 'delivery', reference: ref });
  await sendPush(clientUserId, titre, message, `/client/suivi-commande?id=${order.id_commande}`);
  const client = await prisma.utilisateur.findUnique({ where: { id_user: clientUserId }, select: { email: true } });
  if (client) {
    const tpl = emailTemplates.driver_assigned({ orderId: order.id_commande, clientName, driverName });
    await sendEmail(client.email, tpl.subject, tpl.html);
  }
}

export async function notifyDeliveryStatus(order, clientUserId, clientName, status) {
  const titre = `Commande #${order.id_commande} — ${status}`;
  const message = `Statut : ${status}`;
  const ref = `delivery:${order.id_commande}`;
  await createNotification({ userId: clientUserId, titre, message, type: 'delivery', reference: ref });
  await sendPush(clientUserId, titre, message, `/client/suivi-commande?id=${order.id_commande}`);
  const client = await prisma.utilisateur.findUnique({ where: { id_user: clientUserId }, select: { email: true } });
  if (client) {
    const tpl = emailTemplates.delivery_status({ orderId: order.id_commande, clientName, status });
    await sendEmail(client.email, tpl.subject, tpl.html);
  }
}

export async function notifyPaymentReceived(order, recipients, amount, method) {
  for (const r of recipients) {
    const titre = `Paiement reçu — #${order.id_commande}`;
    const message = `${amount} F reçus via ${method}`;
    const ref = `payment:${order.id_commande}`;
    await createNotification({ userId: r.userId, titre, message, type: 'payment', reference: ref });
    await sendPush(r.userId, titre, message, `/client/mes-commandes`);
    const user = await prisma.utilisateur.findUnique({ where: { id_user: r.userId }, select: { email: true } });
    if (user) {
      const tpl = emailTemplates.payment_received({ orderId: order.id_commande, recipientName: r.name, amount: amount.toLocaleString(), method });
      await sendEmail(user.email, tpl.subject, tpl.html);
    }
  }
}

export async function notifyFeedbackReceived(orderId, vendorUserId, vendorName, rating, comment, clientName) {
  const titre = `Nouvel avis — #${orderId}`;
  const message = `${clientName} a donné ${rating}/5 étoiles`;
  const ref = `feedback:${orderId}`;
  await createNotification({ userId: vendorUserId, titre, message, type: 'feedback', reference: ref });
  await sendPush(vendorUserId, titre, message, `/vendor/commandes`);
  const vendor = await prisma.utilisateur.findUnique({ where: { id_user: vendorUserId }, select: { email: true } });
  if (vendor) {
    const tpl = emailTemplates.feedback_received({ orderId, vendorName, rating, comment });
    await sendEmail(vendor.email, tpl.subject, tpl.html);
  }
}

// ─── Generate VAPID keys (for setup) ───
export function generateVapidKeys() {
  return webpush.generateVAPIDKeys();
}
