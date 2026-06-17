import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import vendeurRoutes from './routes/vendeurRoutes.js';
import livreurRoutes from './routes/livreurRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { handleWebhook } from './controllers/paymentController.js';
import { internalError } from './utils/errors.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ESM directory name resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : [];
const isDev = process.env.APP_ENV === 'local' || process.env.APP_ENV === 'development';
app.use(cors({
  origin: isDev ? true : (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf.toString(); }
}));
app.use(express.urlencoded({ extended: true }));

// Serve photo proofs statically (RG07)
// Points to the uploads folder in the root of the backend
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API Backend ViteComm (MVP Académique)' });
});

// Webhook FedaPay (before auth — verified by HMAC signature)
app.post('/api/webhooks/fedapay', handleWebhook);

// FedaPay may redirect the browser to callback_url via GET instead of return_url
app.get('/api/webhooks/fedapay', async (req, res) => {
  try {
    const { status, id, transaction_id, reference } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const ref = transaction_id || reference || '';

    // If we already have our transaction_id, redirect directly
    if (ref) {
      const statusParam = status === 'approved' ? 'success' : (status === 'declined' || status === 'canceled') ? 'failed' : 'pending';
      return res.redirect(`${frontendUrl}/client/paiement?status=${statusParam}&ref=${ref}`);
    }

    // Otherwise look up by FedaPay transaction ID to find our reference
    if (id) {
      const prisma = (await import('./config/db.js')).default;
      const txn = await prisma.paiementTransaction.findFirst({
        where: { fedapay_transaction_id: String(id) },
      });
      if (txn) {
        const statusParam = status === 'approved' ? 'success' : (status === 'declined' || status === 'canceled') ? 'failed' : 'pending';
        return res.redirect(`${frontendUrl}/client/paiement?status=${statusParam}&ref=${txn.transaction_id}&id_commande=${txn.id_commande}`);
      }
    }

    // Fallback: redirect to orders page
    res.redirect(`${frontendUrl}/client/mes-commandes`);
  } catch (err) {
    console.error('[Webhook GET redirect error]', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/client/mes-commandes`);
  }
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/client/payment', paymentRoutes);
app.use('/api/vendor', vendeurRoutes);
app.use('/api/livreur', livreurRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: internalError(err)
  });
});

app.listen(PORT, () => {
  console.log(`Le serveur ViteComm écoute sur le port ${PORT}`);
});
