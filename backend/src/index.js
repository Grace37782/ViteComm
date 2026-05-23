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

const app = express();
const PORT = process.env.PORT || 5000;

// ESM directory name resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors({ origin: '*' })); // Allow all origins for the MVP
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve photo proofs statically (RG07)
// Points to the uploads folder in the root of the backend
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API Backend ViteComm (MVP Académique)' });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/vendor', vendeurRoutes);
app.use('/api/driver', livreurRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Une erreur interne est survenue.'
  });
});

app.listen(PORT, () => {
  console.log(`Le serveur ViteComm écoute sur le port ${PORT}`);
});
